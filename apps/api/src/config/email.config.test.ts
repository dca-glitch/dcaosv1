import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEmailProviderConfig, getEmailProviderSafetyShape } from "./email.config";

const ENV_KEYS = ["EMAIL_PROVIDER", "EMAIL_FROM_ADDRESS", "EMAIL_REPLY_TO", "RESEND_API_KEY"] as const;

function withEnv(overrides: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>, run: () => void) {
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }

  try {
    for (const key of ENV_KEYS) {
      const value = overrides[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    run();
  } finally {
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("email.config — disabled-safe local defaults", () => {
  it("defaults to the local, non-sending provider when no env is set", () => {
    withEnv({}, () => {
      const config = getEmailProviderConfig();
      assert.equal(config.provider, "local");
      assert.equal(config.hasResendApiKey, false);
      assert.equal(config.fromAddress, "no-reply@notifications.digitalcubeagency.net");
      assert.equal(config.replyTo, "admin@digitalcubeagency.net");
    });
  });

  it("falls back to local for any unrecognized EMAIL_PROVIDER value", () => {
    withEnv({ EMAIL_PROVIDER: "sendgrid" }, () => {
      assert.equal(getEmailProviderConfig().provider, "local");
    });
  });

  it("reports hasResendApiKey without ever exposing the key value", () => {
    withEnv({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test_should_not_leak" }, () => {
      const config = getEmailProviderConfig();
      assert.equal(config.provider, "resend");
      assert.equal(config.hasResendApiKey, true);
      assert.equal(JSON.stringify(config).includes("re_test_should_not_leak"), false);
    });
  });

  it("reports resend provider as configured-but-unkeyed when RESEND_API_KEY is absent", () => {
    withEnv({ EMAIL_PROVIDER: "resend" }, () => {
      const config = getEmailProviderConfig();
      assert.equal(config.provider, "resend");
      assert.equal(config.hasResendApiKey, false);
    });
  });

  it("exposes a safe shape where missing config disables sending", () => {
    withEnv({}, () => {
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.provider, "local");
      assert.equal(shape.sendingEnabled, false);
      assert.equal(shape.localNoSend, true);
      assert.equal(shape.liveProofRequired, false);
    });
  });

  it("treats configured Resend as live-proof-required without serializing secrets", () => {
    withEnv({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test_should_not_leak" }, () => {
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.provider, "resend");
      assert.equal(shape.hasResendApiKey, true);
      assert.equal(shape.sendingEnabled, true);
      assert.equal(shape.localNoSend, false);
      assert.equal(shape.liveProofRequired, true);
      assert.equal(JSON.stringify(shape).includes("re_test_should_not_leak"), false);
    });
  });
});
