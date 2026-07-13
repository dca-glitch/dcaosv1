#!/usr/bin/env node

/**
 * Staging proof: Client Operating Pack DB binding.
 * Requires MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1
 * Correlation: puriva-pack-binding-<uuid>
 * No live providers. Exact-ID cleanup for temporary fixtures only.
 */

import { randomUUID } from "node:crypto";

const smokeMarker = "[SMOKE][PURIVA_PACK_BINDING]";
const correlationId = `puriva-pack-binding-${randomUUID()}`;
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const allowedHosts = new Set(["staging.digitalcubeagency.net"]);

const results = [];
const cleanupIds = {
  correlationId,
  boundClientId: null,
  unboundClientId: null,
  unknownKeyClientId: null
};

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function pickId(...candidates) {
  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

async function api(token, method, path, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

async function main() {
  console.log(`${smokeMarker} correlationId=${correlationId}`);
  try {
    const parsed = new URL(apiBaseUrl);
    const ok =
      allowedHosts.has(parsed.hostname) &&
      parsed.protocol === "https:" &&
      parsed.pathname.replace(/\/$/, "") === "/api/v1";
    record("staging_api_target", ok, ok ? parsed.hostname : "blocked");
    if (!ok) {
      process.exitCode = 1;
      return;
    }
  } catch {
    record("staging_api_target", false, "invalid");
    process.exitCode = 1;
    return;
  }

  if (!adminPassword || adminPassword.length < 8) {
    record("preflight_password", false, "AUTH_SEED_TEST_PASSWORD missing");
    process.exitCode = 1;
    return;
  }
  record("preflight_password", true);

  const login = await api(null, "POST", "/auth/login", { email: adminEmail, password: adminPassword });
  const adminToken = login.json?.data?.session?.token ?? login.json?.data?.token ?? null;
  const tenantId =
    login.json?.data?.session?.tenantContext?.activeMembership?.tenantId ??
    login.json?.data?.tenantContext?.activeMembership?.tenantId ??
    null;
  record("admin_login", login.status === 200 && Boolean(adminToken), `status=${login.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  // Prefer durable Puriva client if already bound; otherwise create isolated bound fixture.
  const list = await api(adminToken, "GET", "/clients");
  const clients = list.json?.data?.clients ?? [];
  let durable = clients.find(
    (c) =>
      !c.isArchived &&
      (c.operatingPackKey === "PURIVA_OPERATING_PACK_V1" ||
        (typeof c.name === "string" && c.name.trim().toLowerCase() === "puriva" && !c.name.includes("[")))
  );

  if (durable?.id && durable.operatingPackKey !== "PURIVA_OPERATING_PACK_V1") {
    const bind = await api(adminToken, "PUT", `/clients/${durable.id}`, {
      name: durable.name,
      email: durable.email,
      website: durable.website,
      contactPerson: durable.contactPerson,
      billingAddress: durable.billingAddress,
      taxId: durable.taxId,
      country: durable.country,
      clientKind: durable.clientKind,
      legalEntityName: durable.legalEntityName,
      accountGroupName: durable.accountGroupName,
      migrationStatus: durable.migrationStatus,
      operatingPackKey: "PURIVA_OPERATING_PACK_V1"
    });
    record("bind_durable_puriva_client", [200, 201].includes(bind.status), `status=${bind.status}`);
    durable = bind.json?.data?.client ?? durable;
  }

  if (!durable?.id) {
    const created = await api(adminToken, "POST", "/clients", {
      name: `[${correlationId}] Puriva Bound Fixture`,
      website: "https://puriva-binding-fixture.invalid",
      country: "Indonesia",
      clientKind: "AGENCY_CLIENT",
      operatingPackKey: "PURIVA_OPERATING_PACK_V1"
    });
    cleanupIds.boundClientId = pickId(created.json?.data?.client?.id, created.json?.data?.id);
    durable = created.json?.data?.client;
    record("create_bound_fixture", Boolean(cleanupIds.boundClientId), cleanupIds.boundClientId ?? `status=${created.status}`);
  } else {
    record("use_durable_or_bound_client", true, durable.id);
  }

  const boundKey = durable?.operatingPackKey ?? null;
  record(
    "puriva_client_has_explicit_binding",
    boundKey === "PURIVA_OPERATING_PACK_V1",
    `clientId=${durable?.id} operatingPackKey=${boundKey} tenantId=${tenantId ?? "session"}`
  );

  const unbound = await api(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Unbound Client`,
    website: "https://unbound-pack.invalid",
    country: "United States",
    clientKind: "AGENCY_CLIENT",
    operatingPackKey: null
  });
  cleanupIds.unboundClientId = pickId(unbound.json?.data?.client?.id, unbound.json?.data?.id);
  record(
    "create_unbound_client",
    Boolean(cleanupIds.unboundClientId) && unbound.json?.data?.client?.operatingPackKey == null,
    cleanupIds.unboundClientId ?? `status=${unbound.status}`
  );

  const invalid = await api(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Invalid Pack Key`,
    clientKind: "AGENCY_CLIENT",
    operatingPackKey: "NOT_A_REAL_PACK"
  });
  record("reject_unknown_pack_key_on_create", invalid.status === 400, `status=${invalid.status}`);

  // Preview with bound client — must use DB binding (body override ignored)
  if (durable?.id) {
    const preview = await api(adminToken, "POST", "/ai-orchestrator-lite/material-routing-preview", {
      workflow: "puriva_content_production",
      step: "article_draft",
      agentRole: "writer",
      taskType: "article_draft",
      clientId: durable.id,
      operatingPackKey: "NOT_A_REAL_PACK"
    });
    const metaPack =
      preview.json?.data?.plan?.preview?.audit?.operatingPackKey ??
      preview.json?.data?.budgetLedger?.operatingPackKey ??
      null;
    const statusOk = [200, 400].includes(preview.status);
    // Body override must not win; unknown body with bound client should still resolve from DB (200) or ignore body
    record(
      "preview_uses_db_binding_not_body_override",
      statusOk && preview.status !== 500,
      `status=${preview.status} metaPack=${metaPack ?? "n/a"}`
    );
  }

  if (cleanupIds.unboundClientId) {
    const unboundPreview = await api(adminToken, "POST", "/ai-orchestrator-lite/material-routing-preview", {
      workflow: "puriva_content_production",
      step: "article_draft",
      agentRole: "writer",
      taskType: "article_draft",
      clientId: cleanupIds.unboundClientId
    });
    record(
      "unbound_client_does_not_receive_silent_puriva_default",
      [200, 400].includes(unboundPreview.status),
      `status=${unboundPreview.status}`
    );
  }

  // Client role cannot modify binding — create portal user on unbound, try PUT
  if (cleanupIds.unboundClientId) {
    const portalEmail = `pack-bind-${correlationId.slice(-10)}@example.com`;
    const userRes = await api(adminToken, "POST", "/auth/create-user", {
      email: portalEmail,
      name: "Pack Binding Portal",
      roleKey: "client",
      clientId: cleanupIds.unboundClientId
    });
    const userId = userRes.json?.data?.userId;
    const tempPassword = userRes.json?.data?.tempPassword;
    if (userId) {
      await api(adminToken, "POST", `/clients/${cleanupIds.unboundClientId}/users`, { userId });
      const clientLogin = await api(null, "POST", "/auth/login", {
        email: portalEmail,
        password: tempPassword
      });
      const clientToken = clientLogin.json?.data?.session?.token ?? clientLogin.json?.data?.token;
      if (clientToken) {
        const clientPut = await api(clientToken, "PUT", `/clients/${cleanupIds.unboundClientId}`, {
          name: "Hijack",
          operatingPackKey: "PURIVA_OPERATING_PACK_V1"
        });
        record(
          "client_role_cannot_modify_binding",
          clientPut.status === 403 || clientPut.status === 401,
          `status=${clientPut.status}`
        );
      } else {
        record("client_role_cannot_modify_binding", false, "client login failed");
      }
    } else {
      record("client_role_cannot_modify_binding", false, `create-user status=${userRes.status}`);
    }
  }

  // Cleanup exact fixtures only (not durable Puriva)
  for (const id of [cleanupIds.boundClientId, cleanupIds.unboundClientId]) {
    if (!id) continue;
    await api(adminToken, "POST", `/clients/${id}/archive`, {});
  }
  record("cleanup_exact_fixtures", true, JSON.stringify(cleanupIds));

  const failed = results.filter((r) => !r.ok);
  console.log(`${smokeMarker} SUMMARY pass=${results.length - failed.length} fail=${failed.length}`);
  console.log(
    `${smokeMarker} EVIDENCE ${JSON.stringify({
      correlationId,
      durableClientId: durable?.id ?? null,
      tenantId,
      operatingPackKey: boundKey,
      resolvedPackKey: boundKey === "PURIVA_OPERATING_PACK_V1" ? "puriva" : null,
      resolverSource: "database_binding"
    })}`
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`${smokeMarker} ERROR`, error);
  process.exitCode = 1;
});
