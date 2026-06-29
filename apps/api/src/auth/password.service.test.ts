import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPasswordPolicyConfig, hashPassword, validatePasswordPolicy, verifyPassword } from "./password.service";

describe("password service", () => {
  it("validates minimum length policy", () => {
    const config = getPasswordPolicyConfig({ minLength: 10 });
    const short = validatePasswordPolicy("short", config);
    assert.equal(short.ok, false);
    assert.ok(short.issues.some((issue) => /10 characters/i.test(issue)));

    const valid = validatePasswordPolicy("long-enough-password", config);
    assert.equal(valid.ok, true);
  });

  it("rejects whitespace-only passwords", () => {
    const result = validatePasswordPolicy("   ");
    assert.equal(result.ok, false);
  });

  it("hashes and verifies passwords", () => {
    const hash = hashPassword("test-password-value");
    assert.match(hash, /^scrypt\$/);
    assert.equal(verifyPassword("test-password-value", hash), true);
    assert.equal(verifyPassword("wrong-password", hash), false);
  });
});
