// Focused smoke for Client Access admin foundation.
// Proves admin list/grant/revoke plus client-portal client bounds and FINAL-only monthly report visibility.

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl).replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  const ok = typeof value === "string" && value.length > 0;
  record(`env ${name}`, ok, ok ? "present" : "missing");
  return ok;
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function responseHasSensitiveFields(response) {
  return /passwordHash|sessionTokenHash|storageKey|adminSummaryNotes|tenantId|workflowRunId|executionLog|executionError/i.test(response.text);
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body, text };
}

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

function requireOkData(name, response, expectedStatus = 201) {
  const ok = response.status === expectedStatus && response.body?.ok === true;
  record(name, ok, `${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return response.body.data;
}

function hasProject(projects, projectId) {
  return Array.isArray(projects) && projects.some((project) => project.id === projectId);
}

async function createProjectAndReport(adminToken, client, namePrefix, targetMonth, reportStatus) {
  const project = requireOkData(
    `${namePrefix} create ai delivery project`,
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: `[SMOKE][CLIENT_ACCESS] ${makeSmokeId(`${namePrefix}-project`)}`,
        targetMonth
      }
    })
  ).aiDeliveryProject;

  const report = requireOkData(
    `${namePrefix} create monthly report`,
    await request(`/ai-delivery/reports/monthly/${project.id}`, {
      method: "POST",
      token: adminToken,
      body: { title: `[SMOKE][CLIENT_ACCESS] ${makeSmokeId(`${namePrefix}-report`)}` }
    })
  ).report;

  if (reportStatus !== "DRAFT") {
    const statusResponse = await request(`/ai-delivery/reports/monthly/${report.id}/status`, {
      method: "POST",
      token: adminToken,
      body: { status: reportStatus }
    });
    record(
      `${namePrefix} advance monthly report to ${reportStatus}`,
      statusResponse.status === 200 && statusResponse.body?.ok === true && statusResponse.body?.data?.report?.status === reportStatus,
      `${statusResponse.status}`
    );
  }

  return { project, report };
}

async function createClientProjectAndReport(adminToken, namePrefix, targetMonth, reportStatus) {
  const client = requireOkData(
    `${namePrefix} create client`,
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CLIENT_ACCESS] ${makeSmokeId(`${namePrefix}-client`)}`, country: "United States" }
    })
  ).client;

  const { project, report } = await createProjectAndReport(adminToken, client, namePrefix, targetMonth, reportStatus);

  return { client, project, report };
}

async function main() {
  if (!requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword)) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  const health = await request("/health");
  record(
    "api health ready",
    health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
    `${health.status}`
  );
  if (health.status !== 200 || health.body?.data?.database?.status !== "ready") {
    process.exitCode = 1;
    return;
  }

  const loginResponse = await login(adminEmail, adminPassword);
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  const adminUserId = loginResponse.body?.data?.user?.id ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  record("admin user id present", typeof adminUserId === "string" && adminUserId.length > 0, adminUserId ? "present" : "missing");
  if (!adminToken || !adminUserId) {
    console.error("STOP: Admin login failed.");
    process.exitCode = 1;
    return;
  }

  const primary = await createClientProjectAndReport(adminToken, "primary", "2026-08", "FINAL");
  const sameClientDraftOnly = await createProjectAndReport(adminToken, primary.client, "same-client-draft", "2026-09", "DRAFT");
  const unrelated = await createClientProjectAndReport(adminToken, "unrelated", "2026-10", "FINAL");

  const initialAccess = await request(`/clients/${primary.client.id}/users`, { token: adminToken });
  record(
    "admin can list client access before grant",
    initialAccess.status === 200 && initialAccess.body?.ok === true && Array.isArray(initialAccess.body?.data?.users),
    `${initialAccess.status}`
  );
  record("admin access list excludes secrets", !responseHasSensitiveFields(initialAccess), "safe fields");

  const projectListBeforeGrant = await request("/client-portal/projects", { token: adminToken });
  record(
    "primary project hidden before grant",
    projectListBeforeGrant.status === 200 && !hasProject(projectListBeforeGrant.body?.data?.aiDeliveryProjects, primary.project.id),
    `${projectListBeforeGrant.status}`
  );

  const grant = requireOkData(
    "admin can grant client access",
    await request(`/clients/${primary.client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  ).access;
  record("grant is tied to requested client", grant?.clientId === primary.client.id, grant?.clientId ?? "missing");
  record("grant is tied to requested user", grant?.user?.id === adminUserId, grant?.user?.id ?? "missing");

  const accessAfterGrant = await request(`/clients/${primary.client.id}/users`, { token: adminToken });
  const grantedUsers = accessAfterGrant.body?.data?.users ?? [];
  record(
    "admin can list granted client access",
    accessAfterGrant.status === 200 && grantedUsers.some((entry) => entry.user?.id === adminUserId),
    `${accessAfterGrant.status}`
  );
  record("admin granted list excludes secrets", !responseHasSensitiveFields(accessAfterGrant), "safe fields");

  const unrelatedAccess = await request(`/clients/${unrelated.client.id}/users`, { token: adminToken });
  const unrelatedUsers = unrelatedAccess.body?.data?.users ?? [];
  record(
    "grant does not leak to unrelated client access list",
    unrelatedAccess.status === 200 && !unrelatedUsers.some((entry) => entry.user?.id === adminUserId),
    `${unrelatedAccess.status}`
  );

  const missingClientGrant = await request("/clients/00000000-0000-0000-0000-000000000000/users", {
    method: "POST",
    token: adminToken,
    body: { userId: adminUserId }
  });
  record("grant to missing client is rejected", missingClientGrant.status === 404, `${missingClientGrant.status}`);

  const missingUserGrant = await request(`/clients/${primary.client.id}/users`, {
    method: "POST",
    token: adminToken,
    body: { userId: "00000000-0000-0000-0000-000000000000" }
  });
  record("grant to missing tenant user is rejected", missingUserGrant.status === 404, `${missingUserGrant.status}`);

  const projectListAfterGrant = await request("/client-portal/projects", { token: adminToken });
  const visibleProjectsAfterGrant = projectListAfterGrant.body?.data?.aiDeliveryProjects ?? [];
  record(
    "linked client project visible after grant",
    projectListAfterGrant.status === 200 && hasProject(visibleProjectsAfterGrant, primary.project.id),
    `${projectListAfterGrant.status}`
  );
  record(
    "same-client draft project visible after client-level grant",
    hasProject(visibleProjectsAfterGrant, sameClientDraftOnly.project.id),
    "client-level access"
  );
  record(
    "unrelated client project hidden after grant",
    !hasProject(visibleProjectsAfterGrant, unrelated.project.id),
    "unrelated client hidden"
  );
  record("portal project list excludes internal fields", !responseHasSensitiveFields(projectListAfterGrant), "safe fields");

  const finalReports = await request(`/client-portal/projects/${primary.project.id}/monthly-reports`, { token: adminToken });
  const finalReportList = finalReports.body?.data?.monthlyReports ?? [];
  record(
    "client portal monthly report access is FINAL-only",
    finalReports.status === 200 && finalReportList.length > 0 && finalReportList.every((report) => report.status === "FINAL"),
    `${finalReports.status} count=${finalReportList.length}`
  );
  record("client portal monthly report response excludes internals", !responseHasSensitiveFields(finalReports), "safe fields");

  const draftReports = await request(`/client-portal/projects/${sameClientDraftOnly.project.id}/monthly-reports`, { token: adminToken });
  record(
    "DRAFT-only project returns empty monthly reports list",
    draftReports.status === 200 && Array.isArray(draftReports.body?.data?.monthlyReports) && draftReports.body.data.monthlyReports.length === 0,
    `${draftReports.status} count=${draftReports.body?.data?.monthlyReports?.length ?? "?"}`
  );

  const unrelatedReports = await request(`/client-portal/projects/${unrelated.project.id}/monthly-reports`, { token: adminToken });
  record("unrelated client monthly reports blocked", unrelatedReports.status === 404, `${unrelatedReports.status}`);

  const revoke = await request(`/clients/${primary.client.id}/users/${adminUserId}/archive`, {
    method: "POST",
    token: adminToken
  });
  record("admin can revoke client access", revoke.status === 200 && revoke.body?.ok === true, `${revoke.status}`);

  const accessAfterRevoke = await request(`/clients/${primary.client.id}/users`, { token: adminToken });
  const usersAfterRevoke = accessAfterRevoke.body?.data?.users ?? [];
  record(
    "revoked access no longer appears in active list",
    accessAfterRevoke.status === 200 && !usersAfterRevoke.some((entry) => entry.user?.id === adminUserId),
    `${accessAfterRevoke.status}`
  );

  const archivedList = await request(`/clients/${primary.client.id}/users?includeArchived=true`, { token: adminToken });
  const archivedEntry = (archivedList.body?.data?.users ?? []).find((entry) => entry.user?.id === adminUserId);
  record(
    "archived access visible with includeArchived query",
    archivedList.status === 200 && archivedEntry?.isArchived === true,
    `${archivedList.status}`
  );

  const projectListAfterRevoke = await request("/client-portal/projects", { token: adminToken });
  record(
    "linked client projects hidden after revoke",
    projectListAfterRevoke.status === 200 && !hasProject(projectListAfterRevoke.body?.data?.aiDeliveryProjects, primary.project.id),
    `${projectListAfterRevoke.status}`
  );

  const finalReportsAfterRevoke = await request(`/client-portal/projects/${primary.project.id}/monthly-reports`, { token: adminToken });
  record("monthly reports blocked after revoke", finalReportsAfterRevoke.status === 404, `${finalReportsAfterRevoke.status}`);

  const allPassed = results.every((result) => result.ok);
  if (allPassed) {
    console.log("PROVEN: Admin can grant, list, and revoke client access without exposing secrets.");
    console.log("PROVEN: Client Portal visibility is bounded by ClientUserAccess client grants.");
    console.log("PROVEN: Monthly reports remain FINAL-only and hidden after access revoke.");
    console.log("NOTE: Current ClientUserAccess schema is client-level; project-specific grants require a future schema-approved block.");
  } else {
    console.log("NOT PROVEN: one or more client access checks failed.");
  }

  process.exitCode = allPassed ? 0 : 1;
}

main().catch((error) => {
  console.error(`FAIL client access smoke runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
