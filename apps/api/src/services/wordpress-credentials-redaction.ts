/**
 * WordPress credential redaction helpers (local-only).
 * Ensures credentials/tokens never serialize into API/log shapes.
 * No HTTP. No secret storage.
 */

const CREDENTIAL_KEY_PATTERN =
  /^(applicationPassword|password|token|accessToken|refreshToken|bearerToken|apiKey|api_key|secret|clientSecret|authHeader|authorization|ciphertext|iv|authTag|masterKey|credential|credentials)$/i;

const SENSITIVE_VALUE_HINT_PATTERN =
  /(application[_-]?password|wp[_-]?app[_-]?password|bearer\s+[a-z0-9._-]+|token=|ciphertext)/i;

export type WordPressRedactedCredentialShape = {
  configured: boolean;
  encryptionAvailable: boolean;
  updatedAt: string | null;
};

export type WordPressRedactedCredentialMetadata = {
  credentialsPresent: boolean;
  siteUrlHost: string | null;
};

/**
 * Build a serializable credential policy shape with presence flags only.
 * Extra credential-like keys on the input are dropped and never returned.
 */
export function redactWordPressCredentialShape(input: {
  configured?: boolean;
  encryptionAvailable?: boolean;
  updatedAt?: string | Date | null;
  [key: string]: unknown;
}): WordPressRedactedCredentialShape {
  return {
    configured: input.configured === true,
    encryptionAvailable: input.encryptionAvailable === true,
    updatedAt: input.updatedAt instanceof Date ? input.updatedAt.toISOString() : (input.updatedAt as string | null | undefined) ?? null
  };
}

/**
 * Build audit metadata with host-only site identity and credential presence.
 * Query strings, paths, and tokens from siteUrl are never retained.
 */
export function redactWordPressCredentialMetadata(input: {
  credentialsPresent?: boolean;
  siteUrl?: string | null;
  [key: string]: unknown;
}): WordPressRedactedCredentialMetadata {
  let siteUrlHost: string | null = null;
  if (typeof input.siteUrl === "string" && input.siteUrl.trim()) {
    try {
      siteUrlHost = new URL(input.siteUrl).hostname;
    } catch {
      siteUrlHost = null;
    }
  }

  return {
    credentialsPresent: input.credentialsPresent === true,
    siteUrlHost
  };
}

/**
 * Deep-clone a value for serialization while stripping credential-like keys
 * and rejecting string values that look like secrets.
 */
export function redactWordPressSerializableValue<T>(value: T): T {
  return redactNode(value) as T;
}

function redactNode(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    if (SENSITIVE_VALUE_HINT_PATTERN.test(value)) {
      return "[REDACTED]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactNode(entry));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (CREDENTIAL_KEY_PATTERN.test(key)) {
        continue;
      }
      output[key] = redactNode(entry);
    }
    return output;
  }

  return value;
}

/**
 * True when a JSON serialization of value contains no credential keys/values
 * from the known WordPress secret surface.
 */
export function assertWordPressCredentialsNeverSerialize(value: unknown): boolean {
  const serialized = JSON.stringify(redactWordPressSerializableValue(value));
  if (serialized.includes("applicationPassword")) {
    return false;
  }
  if (serialized.includes("ciphertext")) {
    return false;
  }
  if (/"(password|token|apiKey|secret|authHeader|bearerToken)"\s*:/i.test(serialized)) {
    return false;
  }
  return true;
}
