import { randomBytes } from "node:crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
const PASSWORD_LENGTH = 12;

export function generateTemporaryPassword(): string {
  const bytes = randomBytes(PASSWORD_LENGTH);
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join("");
}
