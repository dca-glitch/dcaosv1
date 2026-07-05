const REMOTE_TARGET_ENV = "DCA_SMOKE_REMOTE_TARGET";
const REQUIRED_REMOTE_TARGET = "staging";
const PRODUCTION_PROBE_ENV = "DCA_SMOKE_ALLOW_PRODUCTION_HEALTH_PROBE";
const PRODUCTION_PROBE_VALUE = "1";

const stagingApiBaseUrl = "https://staging.digitalcubeagency.net/api/v1";
const stagingWebRootUrl = "https://staging.digitalcubeagency.net/";
const productionHealthUrl = "https://system.digitalcubeagency.net/api/v1/health";
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const negativeLoginEmail = "dca-smoke-negative-login@invalid.local";
const negativeLoginPassword = "not-the-staging-password";

const results = [];
const warnings = [];

const sensitivePatterns = [
  /passwordHash/i,
  /sessionTokenHash/i,
  /DATABASE_URL/i,
  /postgres(?:ql)?:\/\//i,
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/i,
  /sk-[A-Za-z0-9_-]{12,}/i,
  /sk-or-[A-Za-z0-9_-]{12,}/i,
  /re_[A-Za-z0-9]{10,}/i
];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function warn(name, detail = "") {
  warnings.push({ name, detail });
  console.log(`WARN ${name}${detail ? ` - ${detail}` : ""}`);
}

function getHeader(response, name) {
  return response.headers.get(name) ?? "";
}

function responseLeaksSensitiveData(response) {
  return sensitivePatterns.some((pattern) => pattern.test(response.text));
}

function getErrorCode(response) {
  return response.body?.error?.code ?? "";
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(urlOrPath, options = {}) {
  const url = urlOrPath.startsWith("http") ? urlOrPath : `${stagingApiBaseUrl}${urlOrPath}`;
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: options.redirect ?? "follow"
  });
  const text = await response.text();

  return {
    status: response.status,
    headers: response.headers,
    body: parseJson(text),
    text
  };
}

async function checkNoSensitiveLeak(name, response) {
  record(`${name} no sensitive leakage`, !responseLeaksSensitiveData(response), "bounded response scan");
}

function assertRemoteTargetAllowed() {
  if (process.env[REMOTE_TARGET_ENV] !== REQUIRED_REMOTE_TARGET) {
    console.error(
      "Staging security baseline refused: set DCA_SMOKE_REMOTE_TARGET=staging to run live remote checks. Default is refuse (no HTTP requests)."
    );
    return false;
  }

  return true;
}

async function main() {
  if (!assertRemoteTargetAllowed()) {
    process.exitCode = 1;
    return;
  }

  console.log("[SMOKE][STAGING_SECURITY_BASELINE] starting");

  const health = await request("/health");
  record("staging health", health.status === 200 && health.body?.ok === true, `${health.status}`);
  await checkNoSensitiveLeak("staging health", health);
  record("x-powered-by absent", !getHeader(health, "x-powered-by"), getHeader(health, "x-powered-by") ? "present" : "absent");

  const hsts = getHeader(health, "strict-transport-security");
  if (hsts) {
    record("hsts present", true, "present");
  } else {
    warn("hsts missing", "known proxy hardening item; warning only");
  }

  const webRoot = await request(stagingWebRootUrl, { redirect: "manual" });
  record("staging web root reachable", webRoot.status >= 200 && webRoot.status < 400, `${webRoot.status}`);
  await checkNoSensitiveLeak("staging web root", webRoot);

  if (process.env[PRODUCTION_PROBE_ENV] === PRODUCTION_PROBE_VALUE) {
    const productionHealth = await request(productionHealthUrl);
    record("production health reference", productionHealth.status === 200 && productionHealth.body?.ok === true, `${productionHealth.status}`);
    await checkNoSensitiveLeak("production health reference", productionHealth);
  } else {
    console.log(
      "WARN production health probe skipped: set DCA_SMOKE_ALLOW_PRODUCTION_HEALTH_PROBE=1 only with owner approval."
    );
  }

  const unauthenticatedChecks = [
    ["unauth auth/me", "/auth/me"],
    ["unauth auth/context", "/auth/context"],
    ["unauth tenants/current", "/tenants/current"],
    ["unauth modules/current", "/modules/current"]
  ];

  for (const [name, path] of unauthenticatedChecks) {
    const response = await request(path);
    record(name, response.status === 401, `${response.status} ${getErrorCode(response)}`);
    await checkNoSensitiveLeak(name, response);
  }

  // Negative login must use a deterministic non-existent account, never the real admin fixture.
  const failedLogin = await request("/auth/login", {
    method: "POST",
    body: { email: negativeLoginEmail, password: negativeLoginPassword }
  });
  record(
    "negative login safe error",
    failedLogin.status === 401 && getErrorCode(failedLogin) === "AUTH_LOGIN_FAILED",
    `${failedLogin.status} ${getErrorCode(failedLogin)}`
  );
  await checkNoSensitiveLeak("negative login", failedLogin);

  if (!adminPassword) {
    warn("admin login checks skipped", "AUTH_SEED_TEST_PASSWORD is not set");
  } else {
    record("env AUTH_SEED_TEST_PASSWORD", true, "present");
    const adminLogin = await request("/auth/login", {
      method: "POST",
      body: { email: adminEmail, password: adminPassword }
    });
    const token = adminLogin.body?.data?.session?.token ?? null;
    record("admin login", adminLogin.status === 200 && typeof token === "string", `${adminLogin.status}`);

    if (token) {
      const authenticatedChecks = [
        ["auth/me", "/auth/me"],
        ["auth/context", "/auth/context"],
        ["tenants/current", "/tenants/current"],
        ["modules/current", "/modules/current"]
      ];

      for (const [name, path] of authenticatedChecks) {
        const response = await request(path, { token });
        record(name, response.status === 200 && response.body?.ok === true, `${response.status}`);
        await checkNoSensitiveLeak(name, response);
      }

      const malformedToken = await request("/auth/me", { token: "malformed.smoke.token" });
      record(
        "malformed token rejected",
        malformedToken.status === 401 && getErrorCode(malformedToken) === "AUTH_UNAUTHORIZED",
        `${malformedToken.status} ${getErrorCode(malformedToken)}`
      );
      await checkNoSensitiveLeak("malformed token", malformedToken);

      const logout = await request("/auth/logout", { method: "POST", token });
      record("logout", logout.status === 200 && logout.body?.ok === true, `${logout.status}`);
      await checkNoSensitiveLeak("logout", logout);

      const reusedToken = await request("/auth/me", { token });
      record(
        "reused token rejected",
        reusedToken.status === 401 && getErrorCode(reusedToken) === "AUTH_UNAUTHORIZED",
        `${reusedToken.status} ${getErrorCode(reusedToken)}`
      );
      await checkNoSensitiveLeak("reused token", reusedToken);
    }
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`[SMOKE][STAGING_SECURITY_BASELINE] finished - ${results.length - failed.length}/${results.length} passed, ${warnings.length} warning(s)`);
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`FAIL staging security baseline runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});