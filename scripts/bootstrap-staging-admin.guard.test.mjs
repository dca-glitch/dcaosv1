import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CONFIRM_ENV,
  REQUIRED_CONFIRM_PHRASE,
  validateBootstrapEnvironment,
  validateDatabaseUrlForStagingBootstrap,
  validateWriteConfirmation
} from "./bootstrap-staging-admin.mjs";

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "bootstrap-staging-admin.mjs");

const allowedUrls = [
  "postgresql://u:p@dcaosv1-staging-postgres:5432/dcaosv1_staging",
  "postgresql://u:p@127.0.0.1:5434/dcaosv1_staging",
  "postgresql://u:p@localhost:5434/dcaosv1_staging"
];

const refusedUrls = [
  {
    url: "postgresql://u:p@dcaosv1-postgres:5432/dcaosv1_staging",
    message: 'production-shaped database host "dcaosv1-postgres"'
  },
  {
    url: "postgresql://u:p@postgres:5432/dcaosv1_staging",
    message: 'generic database host "postgres"'
  },
  {
    url: "postgresql://u:p@127.0.0.1:5434/dcaosv1_dev",
    message: "approved staging database name allowlist"
  },
  {
    url: "postgresql://u:p@127.0.0.1:5434/dcaosv1_production",
    message: "production-like"
  }
];

for (const databaseUrl of allowedUrls) {
  test(`allows DATABASE_URL ${databaseUrl}`, () => {
    assert.doesNotThrow(() => validateDatabaseUrlForStagingBootstrap(databaseUrl));
  });
}

for (const { url, message } of refusedUrls) {
  test(`refuses DATABASE_URL ${url}`, () => {
    assert.throws(() => validateDatabaseUrlForStagingBootstrap(url), (error) => {
      assert.match(error.message, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
      return true;
    });
  });
}

test("write mode without confirmation phrase refuses", () => {
  assert.throws(
    () =>
      validateBootstrapEnvironment({
        target: "staging",
        databaseUrl: allowedUrls[0],
        checkOnly: false,
        confirmPhrase: undefined
      }),
    (error) => {
      assert.match(error.message, /I_UNDERSTAND_THIS_MUTATES_STAGING/);
      return true;
    }
  );
});

test("write mode with exact confirmation phrase passes validation", () => {
  assert.doesNotThrow(() =>
    validateBootstrapEnvironment({
      target: "staging",
      databaseUrl: allowedUrls[0],
      checkOnly: false,
      confirmPhrase: REQUIRED_CONFIRM_PHRASE
    })
  );
});

test("--check mode is exempt from confirmation phrase", () => {
  assert.doesNotThrow(() =>
    validateBootstrapEnvironment({
      target: "staging",
      databaseUrl: allowedUrls[0],
      checkOnly: true,
      confirmPhrase: undefined
    })
  );
});

test("validateWriteConfirmation refuses write mode without phrase", () => {
  assert.throws(() => validateWriteConfirmation({ checkOnly: false, confirmPhrase: "wrong" }), /I_UNDERSTAND_THIS_MUTATES_STAGING/);
});

test("missing DCA_BOOTSTRAP_DATABASE_TARGET refuses before bootstrap summary", () => {
  const env = { ...process.env };
  delete env.DCA_BOOTSTRAP_DATABASE_TARGET;
  delete env.DCA_BOOTSTRAP_CONFIRM_STAGING_ADMIN;
  delete env.DATABASE_URL;

  const result = spawnSync(process.execPath, [scriptPath, "--check"], {
    env,
    encoding: "utf8"
  });
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1, "expected exit code 1");
  assert.match(output, /Bootstrap refused:/);
  assert.match(output, /DCA_BOOTSTRAP_DATABASE_TARGET is required/);
  assert.doesNotMatch(output, /Staging admin bootstrap summary/);
  assert.doesNotMatch(output, /postgresql:\/\//);
});
