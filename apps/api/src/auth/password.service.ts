import {
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import {
  AUTH_PASSWORD_MIN_LENGTH_DEFAULT,
  AUTH_PASSWORD_SCRYPT_BLOCK_SIZE,
  AUTH_PASSWORD_SCRYPT_COST,
  AUTH_PASSWORD_SCRYPT_KEY_LENGTH,
  AUTH_PASSWORD_SCRYPT_PARALLELIZATION,
  AUTH_PASSWORD_SCRYPT_SALT_BYTES
} from "./auth.constants";
import type {
  PasswordPolicyConfig,
  PasswordPolicyValidationResult
} from "./types";

export function getPasswordPolicyConfig(
  overrides: Partial<PasswordPolicyConfig> = {}
): PasswordPolicyConfig {
  return {
    minLength: AUTH_PASSWORD_MIN_LENGTH_DEFAULT,
    ...overrides
  };
}

export function validatePasswordPolicy(
  plainPassword: string,
  config: PasswordPolicyConfig = getPasswordPolicyConfig()
): PasswordPolicyValidationResult {
  const issues: string[] = [];

  if (plainPassword.length < config.minLength) {
    issues.push(`Password must be at least ${config.minLength} characters long.`);
  }

  if (plainPassword.trim().length === 0) {
    issues.push("Password must contain non-whitespace characters.");
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

function encodePasswordHash(
  salt: Buffer,
  derivedKey: Buffer
): string {
  return [
    "scrypt",
    `cost=${AUTH_PASSWORD_SCRYPT_COST}`,
    `blockSize=${AUTH_PASSWORD_SCRYPT_BLOCK_SIZE}`,
    `parallelization=${AUTH_PASSWORD_SCRYPT_PARALLELIZATION}`,
    salt.toString("base64url"),
    derivedKey.toString("base64url")
  ].join("$");
}

function decodePasswordHash(encodedHash: string):
  | {
      ok: true;
      salt: Buffer;
      derivedKey: Buffer;
    }
  | {
      ok: false;
    } {
  const parts = encodedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return { ok: false };
  }

  const salt = Buffer.from(parts[4], "base64url");
  const derivedKey = Buffer.from(parts[5], "base64url");

  if (!salt.length || !derivedKey.length) {
    return { ok: false };
  }

  return {
    ok: true,
    salt,
    derivedKey
  };
}

export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(AUTH_PASSWORD_SCRYPT_SALT_BYTES);
  const derivedKey = scryptSync(plainPassword, salt, AUTH_PASSWORD_SCRYPT_KEY_LENGTH, {
    cost: AUTH_PASSWORD_SCRYPT_COST,
    blockSize: AUTH_PASSWORD_SCRYPT_BLOCK_SIZE,
    parallelization: AUTH_PASSWORD_SCRYPT_PARALLELIZATION
  }) as Buffer;

  return encodePasswordHash(salt, derivedKey);
}

export function verifyPassword(plainPassword: string, encodedHash: string): boolean {
  const decoded = decodePasswordHash(encodedHash);
  if (!decoded.ok) {
    return false;
  }

  const derivedKey = scryptSync(plainPassword, decoded.salt, decoded.derivedKey.length, {
    cost: AUTH_PASSWORD_SCRYPT_COST,
    blockSize: AUTH_PASSWORD_SCRYPT_BLOCK_SIZE,
    parallelization: AUTH_PASSWORD_SCRYPT_PARALLELIZATION
  }) as Buffer;

  if (derivedKey.length !== decoded.derivedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, decoded.derivedKey);
}
