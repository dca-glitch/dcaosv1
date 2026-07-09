#!/usr/bin/env node

/**
 * G56/G57–G68 — AI Orchestrator Lite registry, preview, workflow dry-run smoke.
 * Admin-only endpoints; no live provider calls.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL ?? "client@puriva.local";
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const SMOKE_MARKER = "[SMOKE][AI_ORCHESTRATOR_LITE]";
const LOG_PATH = join(process.env.TEMP ?? process.env.TMP ?? ".", `g56-ai-orchestrator-lite-smoke-${Date.now()}.log`);

const FORBIDDEN_PATTERNS = [/sk-or-[a-z0-9]{8,}/i, /passwordHash/i, /sessionTokenHash/i, /-----BEGIN/i];
const logLines = [];

function log(line) {
  console.log(line);
  logLines.push(line);
}

function pass(label, detail = "") {
  log(`  PASS: ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail = "") {
  throw new Error(`${label}${detail ? ` — ${detail}` : ""}`);
}

function assert(condition, label, detail = "") {
  if (!condition) {
    fail(label, detail);
  }
  pass(label, detail);
}

async function apiCall(method, path, body, token) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
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
  return { status: response.status, ok: response.ok, json, text };
}

async function login(email, password) {
  const response = await apiCall("POST", "/auth/login", { email, password });
  const token = response.json?.data?.session?.token ?? "";
  return { response, token };
}

async function main() {
  log(`${SMOKE_MARKER} starting`);
  log(`API_BASE=${API_BASE}`);

  if (!ADMIN_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD is required");
  }

  const health = await apiCall("GET", "/health");
  assert(health.ok && health.json?.data?.database?.status === "ready", "api health ready", `status=${health.status}`);

  const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const adminToken = adminLogin.token;
  assert(adminLogin.response.ok && adminToken, "admin login");

  const registry = await apiCall("GET", "/ai-orchestrator-lite/registry", undefined, adminToken);
  assert(registry.ok, "admin registry GET", `status=${registry.status}`);
  const registryData = registry.json?.data;
  assert(Boolean(registryData?.registry), "registry payload present");
  assert(Boolean(registryData?.purivaPolicyProfile), "puriva policy profile present");
  assert(registryData.purivaPolicyProfile.monthlyAiCapUsd === 100, "Puriva $100 cap visible");

  const providers = registryData.registry.providerRegistry?.providers ?? [];
  assert(providers.length > 0, "providers listed");
  const anyLiveEnabled = providers.some((p) => p.enabled && p.executionMode === "live");
  assert(!anyLiveEnabled, "no live providers enabled in registry");

  const preview = await apiCall(
    "POST",
    "/ai-orchestrator-lite/material-routing-preview",
    {
      workflow: "puriva_content_production",
      step: "article_draft",
      agentRole: "content_drafting_agent",
      taskType: "article_draft",
      operatingPackKey: "puriva"
    },
    adminToken
  );
  assert(preview.ok, "material routing preview POST", `status=${preview.status}`);
  const plan = preview.json?.data?.plan;
  assert(Boolean(plan?.preview), "preview payload present");
  assert(plan.preview.audit.liveProviderCalled === false, "liveProviderCalled false");
  assert(plan.preview.executionMode === "local", "execution mode local");
  assert(plan.preview.inputMaterials.length > 0, "default safe materials included");
  assert(plan.preview.budget.monthlyCapUsd === 100, "preview budget cap $100");
  assert(Boolean(plan.preview.modelRouting), "model routing audit present");
  assert(plan.preview.modelRouting.primaryModel === "anthropic/claude-haiku-4.5", "approved model routed");
  assert(plan.preview.modelRouting.gateway === "openrouter", "openrouter gateway planned");
  assert(plan.preview.modelRouting.requiresBudgetLedger === true, "budget ledger required");
  assert(plan.preview.modelRouting.maxCostUsdPerRun > 0, "route cost cap present");
  assert(typeof plan.preview.modelRouting.allowLive === "boolean", "route allowLive flag present");

  const routingPolicy = registryData.registry.modelRoutingPolicy;
  assert(Boolean(routingPolicy), "model routing policy in registry");
  assert(Array.isArray(routingPolicy.routes) && routingPolicy.routes.length >= 8, "routing table routes listed");
  assert(routingPolicy.approvedModels?.includes("anthropic/claude-haiku-4.5"), "approved model in registry");

  const dryRun = await apiCall(
    "POST",
    "/ai-orchestrator-lite/workflow-dry-run",
    {
      workflow: "puriva_content_production",
      step: "research_pack",
      agentRole: "research_agent",
      taskType: "research_pack",
      operatingPackKey: "puriva",
      stepReference: "puriva_content_production:research_pack"
    },
    adminToken
  );
  assert(dryRun.ok, "workflow dry-run POST", `status=${dryRun.status}`);
  const adapter = dryRun.json?.data?.adapter;
  assert(Boolean(adapter?.dryRunOutput), "dry-run contract output present");
  assert(adapter.executionDeferred === true, "execution deferred");
  assert(Boolean(adapter.dryRunOutput.researchPack), "research pack dry-run placeholder");
  assert(Boolean(registryData.budgetLedger), "budget ledger summary in registry");
  assert(Boolean(registryData.killSwitch), "kill switch snapshot in registry");
  assert(registryData.killSwitch.orchestratorLiveSafe === true, "orchestrator live-safe");

  if (CLIENT_PASSWORD) {
    const clientLogin = await login(CLIENT_EMAIL, CLIENT_PASSWORD);
    const clientToken = clientLogin.token;
    if (clientToken) {
      const denied = await apiCall("GET", "/ai-orchestrator-lite/registry", undefined, clientToken);
      assert(denied.status === 401 || denied.status === 403, "client denied registry", `status=${denied.status}`);
    } else {
      log("  SKIP: client login unavailable for boundary check");
    }
  }

  assert(!FORBIDDEN_PATTERNS.some((pattern) => pattern.test(registry.text)), "registry hides secrets");
  assert(!FORBIDDEN_PATTERNS.some((pattern) => pattern.test(preview.text)), "preview hides secrets");

  log(`\n${SMOKE_MARKER} PASS`);
  writeFileSync(LOG_PATH, logLines.join("\n"), "utf8");
  log(`Log: ${LOG_PATH}`);
}

main().catch((error) => {
  log(`\n${SMOKE_MARKER} FAIL: ${error.message}`);
  writeFileSync(LOG_PATH, logLines.join("\n"), "utf8");
  console.error(`Log: ${LOG_PATH}`);
  process.exit(1);
});
