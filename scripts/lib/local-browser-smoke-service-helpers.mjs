import { execSync, spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getApiBaseUrl() {
  return (process.env.MVP_SMOKE_API_BASE_URL ?? process.env.API_BASE ?? "http://127.0.0.1:4000/api/v1").replace(
    /\/$/,
    ""
  );
}

export function getWebBaseUrl() {
  return (process.env.MVP_SMOKE_WEB_BASE_URL ?? process.env.WEB_BASE ?? "http://localhost:5173").replace(/\/$/, "");
}

function getApiPort(apiBase) {
  try {
    const url = new URL(apiBase);
    if (url.port) {
      return Number(url.port);
    }
    return url.protocol === "https:" ? 443 : 80;
  } catch {
    return 4000;
  }
}

function getWebPort(webBase) {
  try {
    const url = new URL(webBase);
    if (url.port) {
      return Number(url.port);
    }
    return url.protocol === "https:" ? 443 : 80;
  } catch {
    return 5173;
  }
}

function isPortListening(port) {
  if (process.platform === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8", shell: true });
      return output.split(/\r?\n/).some((line) => line.includes("LISTENING"));
    } catch {
      return false;
    }
  }

  try {
    execSync(`lsof -i :${port}`, { stdio: "ignore", shell: true });
    return true;
  } catch {
    return false;
  }
}

function startDetachedNpmScript(scriptName, extraEnv = {}) {
  const child = spawn(npmCmd, ["run", scriptName], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv
    },
    detached: true,
    stdio: "ignore",
    shell: true
  });
  child.unref();
}

export async function waitForApiReady(label, options = {}) {
  const apiBase = options.apiBase ?? getApiBaseUrl();
  const timeoutMs = options.timeoutMs ?? 45000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${apiBase}/health`, { headers: { Accept: "application/json" } });
      if (response.status === 200) {
        const body = await response.json();
        if (body?.ok === true && body?.data?.database?.status === "ready") {
          return { ready: true, detail: `${label}: API/database ready` };
        }
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }

  return { ready: false, detail: `${label}: API not ready at ${apiBase}/health within ${timeoutMs}ms` };
}

export async function waitForWebReady(label, options = {}) {
  const webBase = options.webBase ?? getWebBaseUrl();
  const timeoutMs = options.timeoutMs ?? 30000;
  const candidates = [webBase];
  if (!candidates.includes("http://127.0.0.1:5173")) {
    candidates.push("http://127.0.0.1:5173");
  }
  if (!candidates.includes("http://localhost:5173")) {
    candidates.push("http://localhost:5173");
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, { method: "GET" });
        if (response.status >= 200 && response.status < 500) {
          return { ready: true, detail: `${label}: web reachable at ${candidate}` };
        }
      } catch {
        // try next candidate
      }
    }
    await sleep(1000);
  }

  return { ready: false, detail: `${label}: web not reachable within ${timeoutMs}ms` };
}

export async function ensureLocalBrowserSmokeServices(log = console.log) {
  const apiBase = getApiBaseUrl();
  const webBase = getWebBaseUrl();
  const apiPort = getApiPort(apiBase);
  const webPort = getWebPort(webBase);

  let apiReady = await waitForApiReady("preflight", { apiBase, timeoutMs: 3000 });
  if (!apiReady.ready) {
    if (isPortListening(apiPort)) {
      log(`[SMOKE] API port ${apiPort} busy but health not ready; waiting…`);
      apiReady = await waitForApiReady("api-wait", { apiBase });
    } else {
      log(`[SMOKE] Starting local API on port ${apiPort}`);
      startDetachedNpmScript("dev:api", {
        TENANT_MODULE_ENFORCEMENT: process.env.TENANT_MODULE_ENFORCEMENT ?? "off"
      });
      apiReady = await waitForApiReady("api-start", { apiBase });
    }
  }

  if (!apiReady.ready) {
    throw new Error(apiReady.detail);
  }
  log(`[SMOKE] ${apiReady.detail}`);

  let webReady = await waitForWebReady("preflight", { webBase, timeoutMs: 3000 });
  if (!webReady.ready) {
    if (!isPortListening(webPort)) {
      log(`[SMOKE] Starting local web dev server on port ${webPort}`);
      startDetachedNpmScript("dev:web");
    }
    webReady = await waitForWebReady("web-start", { webBase });
  }

  if (!webReady.ready) {
    throw new Error(webReady.detail);
  }
  log(`[SMOKE] ${webReady.detail}`);
}
