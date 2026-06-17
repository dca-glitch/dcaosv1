import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_STARTUP_ENV_KEYS = [
  "DATABASE_URL"
] as const;

export const RECOMMENDED_STARTUP_ENV_KEYS = [
  "AUTH_SESSION_TTL_MINUTES",
  "AUTH_LOGIN_MAX_FAILED_ATTEMPTS",
  "AUTH_LOGIN_LOCKOUT_MINUTES"
] as const;

export interface StartupEnvironmentResult {
  rootDir: string;
  envFilePath: string | null;
  loadedKeys: string[];
  missingKeys: string[];
  recommendedMissingKeys: string[];
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const normalized = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
  const separatorIndex = normalized.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const key = normalized.slice(0, separatorIndex).trim();
  let value = normalized.slice(separatorIndex + 1).trim();

  if (!key) {
    return null;
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function findRepoRoot(startDir: string): string {
  let current = startDir;

  while (true) {
    if (existsSync(path.join(current, ".env.example")) && existsSync(path.join(current, "package.json"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }

    current = parent;
  }
}

function loadEnvFile(envFilePath: string): string[] {
  const loadedKeys: string[] = [];
  const contents = readFileSync(envFilePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loadedKeys.push(key);
    }
  }

  return loadedKeys;
}

export function loadStartupEnvironment(): StartupEnvironmentResult {
  const sourceDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = findRepoRoot(sourceDir);
  const envFilePath = path.join(rootDir, ".env");

  const loadedKeys = existsSync(envFilePath) ? loadEnvFile(envFilePath) : [];
  const missingKeys = REQUIRED_STARTUP_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
  const recommendedMissingKeys = RECOMMENDED_STARTUP_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });

  return {
    rootDir,
    envFilePath: existsSync(envFilePath) ? envFilePath : null,
    loadedKeys,
    missingKeys,
    recommendedMissingKeys
  };
}

export function formatStartupEnvironmentIssue(result: StartupEnvironmentResult): string | null {
  if (result.missingKeys.length === 0) {
    return null;
  }

  const envFileHint = result.envFilePath
    ? `Loaded from ${result.envFilePath}.`
    : "No .env file was found at the repository root.";

  return `API startup blocked. Missing required environment variables: ${result.missingKeys.join(", ")}. ${envFileHint} Check C:\\dcaosv1\\.env or your shell environment before starting the API.`;
}

export function formatStartupEnvironmentNotice(result: StartupEnvironmentResult): string | null {
  if (result.recommendedMissingKeys.length === 0) {
    return null;
  }

  return `API startup notice. The following auth/session env vars are not set and the app will use defaults: ${result.recommendedMissingKeys.join(", ")}.`;
}
