import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function deriveTenantKey(masterKey: Buffer, tenantId: string): Buffer {
  return createHash("sha256").update(masterKey).update(`:${tenantId}:`).digest();
}

function getMasterKey(): Buffer | null {
  const raw = process.env.CREDENTIAL_ENCRYPTION_MASTER_KEY?.trim();
  if (!raw) {
    return null;
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    return null;
  }

  return key;
}

export function isCredentialEncryptionConfigured(): boolean {
  return getMasterKey() !== null;
}

export function encryptCredentialPlaintext(
  plaintext: string,
  tenantId: string
): { ciphertext: string; iv: string; authTag: string } | null {
  const masterKey = getMasterKey();
  if (!masterKey || !tenantId || !plaintext) {
    return null;
  }

  const key = deriveTenantKey(masterKey, tenantId);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64")
  };
}

export function decryptCredentialPlaintext(
  ciphertext: string,
  iv: string,
  authTag: string,
  tenantId: string
): string | null {
  const masterKey = getMasterKey();
  if (!masterKey || !tenantId || !ciphertext || !iv || !authTag) {
    return null;
  }

  try {
    const key = deriveTenantKey(masterKey, tenantId);
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64")),
      decipher.final()
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
