import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEmailProviderConfig, getEmailProviderSafetyShape } from "./email.config";

const ENV_KEYS = [
  "EMAIL_PROVIDER",
  "EMAIL_FROM_ADDRESS",
  "EMAIL_REPLY_TO",
  "RESEND_API_KEY",
  "EMAIL_LIVE_SEND_AUTHORIZED"
] as const;

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

describe("G505 email config disabled / missing / live-deferred", () => {
  it("defaults to the local, non-sending provider when no env is set", () => {
    withEnv({}, () => {
      const config = getEmailProviderConfig();
      assert.equal(config.provider, "local");
      assert.equal(config.hasResendApiKey, false);
      assert.equal(config.fromAddress, "no-reply@notifications.digitalcubeagency.net");
      assert.equal(config.replyTo, "admin@digitalcubeagency.net");
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.sendingEnabled, false);
      assert.equal(shape.localNoSend, true);
      assert.equal(shape.liveProofRequired, false);
      assert.equal(shape.liveSendDeferred, false);
      assert.equal(shape.liveSendAuthorized, false);
    });
  });

  it("falls back to local for any unrecognized EMAIL_PROVIDER value", () => {
    withEnv({ EMAIL_PROVIDER: "sendgrid" }, () => {
      assert.equal(getEmailProviderConfig().provider, "local");
      assert.equal(getEmailProviderSafetyShape().localNoSend, true);
    });
  });

  it("treats empty EMAIL_PROVIDER as local", () => {
    withEnv({ EMAIL_PROVIDER: "   " }, () => {
      assert.equal(getEmailProviderConfig().provider, "local");
    });
  });

  it("treats whitespace-only RESEND_API_KEY as missing", () => {
    withEnv({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "   " }, () => {
      const config = getEmailProviderConfig();
      assert.equal(config.hasResendApiKey, false);
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.sendingEnabled, false);
      assert.equal(shape.localNoSend, true);
      assert.equal(shape.liveSendDeferred, false);
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
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.sendingEnabled, false);
      assert.equal(shape.localNoSend, true);
      assert.equal(shape.liveProofRequired, false);
      assert.equal(shape.liveSendDeferred, false);
    });
  });

  it("treats keyed Resend without authorization as live-deferred (no-send)", () => {
    withEnv({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test_should_not_leak" }, () => {
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.provider, "resend");
      assert.equal(shape.hasResendApiKey, true);
      assert.equal(shape.liveSendAuthorized, false);
      assert.equal(shape.liveSendDeferred, true);
      assert.equal(shape.sendingEnabled, false);
      assert.equal(shape.localNoSend, true);
      assert.equal(shape.liveProofRequired, true);
      assert.equal(JSON.stringify(shape).includes("re_test_should_not_leak"), false);
    });
  });

  it("enables sending shape only when live send is explicitly authorized", () => {
    withEnv({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_should_not_leak",
      EMAIL_LIVE_SEND_AUTHORIZED: "true"
    }, () => {
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.sendingEnabled, true);
      assert.equal(shape.localNoSend, false);
      assert.equal(shape.liveSendDeferred, false);
      assert.equal(shape.liveSendAuthorized, true);
      assert.equal(shape.liveProofRequired, true);
      assert.equal(JSON.stringify(shape).includes("re_test_should_not_leak"), false);
    });
  });

  it("ignores non-true EMAIL_LIVE_SEND_AUTHORIZED values", () => {
    withEnv({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_should_not_leak",
      EMAIL_LIVE_SEND_AUTHORIZED: "yes"
    }, () => {
      const shape = getEmailProviderSafetyShape();
      assert.equal(shape.liveSendAuthorized, false);
      assert.equal(shape.sendingEnabled, false);
      assert.equal(shape.liveSendDeferred, true);
    });
  });

  it("accepts case-insensitive resend provider label", () => {
    withEnv({ EMAIL_PROVIDER: "ReSeNd" }, () => {
      assert.equal(getEmailProviderConfig().provider, "resend");
      assert.equal(getEmailProviderSafetyShape().sendingEnabled, false);
    });
  });

  it("honors custom from/reply-to without enabling send", () => {
    withEnv({
      EMAIL_FROM_ADDRESS: "ops@example.com",
      EMAIL_REPLY_TO: "reply@example.com"
    }, () => {
      const config = getEmailProviderConfig();
      assert.equal(config.fromAddress, "ops@example.com");
      assert.equal(config.replyTo, "reply@example.com");
      assert.equal(getEmailProviderSafetyShape().localNoSend, true);
    });
  });
});
