const smokeMode = process.argv.includes("--staging") ? "staging" : "local";
const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl;
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL;
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const testerEmail = process.env.AUTH_SEED_TESTER_EMAIL;
const testerPassword = process.env.AUTH_SEED_TESTER_PASSWORD;

const results = [];
const allowedLocalHosts = new Set(["127.0.0.1", "localhost"]);
const allowedStagingHosts = new Set(["system.digitalcubeagency.net"]);

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    record(`env ${name}`, false, "missing");
    return false;
  }

  record(`env ${name}`, true, "present");
  return true;
}

function requireApiBaseUrl(value) {
  try {
    const parsed = new URL(value);
    const pathOk = parsed.pathname.replace(/\/$/, "") === "/api/v1";

    if (smokeMode === "local") {
      const ok = allowedLocalHosts.has(parsed.hostname) && pathOk;
      record("local API target", ok, ok ? parsed.hostname : "blocked non-local host or API path");
      return ok;
    }

    const hasExplicitTarget = typeof process.env.MVP_SMOKE_API_BASE_URL === "string" &&
      process.env.MVP_SMOKE_API_BASE_URL.length > 0;
    const hostOk = allowedStagingHosts.has(parsed.hostname);
    const protocolOk = parsed.protocol === "https:";
    const ok = hasExplicitTarget && hostOk && protocolOk && pathOk;

    record(
      "staging API target",
      ok,
      ok ? parsed.hostname : "blocked unapproved host, protocol, missing explicit target, or API path"
    );
    return ok;
  } catch {
    record(`${smokeMode} API target`, false, "invalid URL");
    return false;
  }
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json"
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    body,
    text
  };
}

function responseHasSensitiveFields(response) {
  return /passwordHash|sessionTokenHash/i.test(response.text);
}

function getErrorCode(response) {
  return response.body?.error?.code ?? "";
}

async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });
}

async function main() {
  if (!requireApiBaseUrl(apiBaseUrl)) {
    process.exitCode = 1;
    return;
  }

  const hasAdminEmail = requireEnv("AUTH_SEED_TEST_EMAIL", adminEmail);
  const hasAdminPassword = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!hasAdminEmail || !hasAdminPassword) {
    process.exitCode = 1;
    return;
  }

  const health = await request("/health");
  record("health", health.status === 200 && health.body?.ok === true, `${health.status}`);

  const failedLogin = await login(adminEmail, "not-the-local-password");
  record(
    "failed login safe error",
    failedLogin.status === 401 && getErrorCode(failedLogin) === "AUTH_LOGIN_FAILED",
    `${failedLogin.status} ${getErrorCode(failedLogin)}`
  );

  const adminLogin = await login(adminEmail, adminPassword);
  const adminToken = adminLogin.body?.data?.session?.token;
  record(
    "login",
    adminLogin.status === 200 &&
      adminLogin.body?.ok === true &&
      typeof adminToken === "string" &&
      !responseHasSensitiveFields(adminLogin),
    `${adminLogin.status}`
  );

  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const checks = [
    ["auth/me", () => request("/auth/me", { token: adminToken }), 200],
    ["auth/context", () => request("/auth/context", { token: adminToken }), 200],
    ["tenants/current", () => request("/tenants/current", { token: adminToken }), 200],
    ["modules", () => request("/modules"), 200],
    ["modules/current", () => request("/modules/current", { token: adminToken }), 200],
    [
      "module enable authorized",
      () => request("/modules/current/finance-lite/enable", { method: "POST", token: adminToken }),
      200
    ],
    [
      "module disable authorized",
      () => request("/modules/current/finance-lite/disable", { method: "POST", token: adminToken }),
      200
    ],
    ["tenant members", () => request("/tenants/current/members", { token: adminToken }), 200],
    ["tenant settings", () => request("/tenants/current/settings", { token: adminToken }), 200]
  ];

  for (const [name, run, expectedStatus] of checks) {
    const response = await run();
    record(
      name,
      response.status === expectedStatus && response.body?.ok === true && !responseHasSensitiveFields(response),
      `${response.status}`
    );
  }

  if (testerEmail && testerPassword) {
    const testerLogin = await login(testerEmail, testerPassword);
    const testerToken = testerLogin.body?.data?.session?.token;
    record("tester login", testerLogin.status === 200 && typeof testerToken === "string", `${testerLogin.status}`);

    if (testerToken) {
      const testerEnable = await request("/modules/current/finance-lite/enable", {
        method: "POST",
        token: testerToken
      });
      record(
        "module enable forbidden for tester",
        testerEnable.status === 403 && getErrorCode(testerEnable) === "AUTH_FORBIDDEN",
        `${testerEnable.status} ${getErrorCode(testerEnable)}`
      );
    }
  } else {
    record("module enable forbidden for tester", true, "skipped optional tester env");
  }

  const logout = await request("/auth/logout", { method: "POST", token: adminToken });
  record("logout", logout.status === 200 && logout.body?.ok === true, `${logout.status}`);

  const reusedToken = await request("/auth/me", { token: adminToken });
  record(
    "reused token unauthorized",
    reusedToken.status === 401 && getErrorCode(reusedToken) === "AUTH_UNAUTHORIZED",
    `${reusedToken.status} ${getErrorCode(reusedToken)}`
  );

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL smoke runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
