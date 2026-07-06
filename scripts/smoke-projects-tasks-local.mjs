#!/usr/bin/env node

/**
 * G34 — Projects & Tasks dedicated local proof.
 *
 * Proves admin can list, create, get, update, archive, and restore
 * both projects and tasks using the core API.
 *
 * Lifecycle proven:
 *   Projects : list → create → get → list-verify → update(status=Paused) → archive → restore
 *   Tasks    : list → create(linked to project) → get → list-verify
 *              → update(IN_PROGRESS) → update(DONE) → archive → restore
 *
 * Notes:
 *   - Task archive requires status=DONE (API returns TASK_ARCHIVE_BLOCKED otherwise).
 *   - No browser, no providers, no live external network.
 *   - Deterministic smoke names with timestamp suffix.
 *   - Exit non-zero on first failure.
 */

const API_BASE = (
  process.env.API_BASE ??
  process.env.MVP_SMOKE_API_BASE_URL ??
  "http://127.0.0.1:4000/api/v1"
).replace(/\/$/, "");

const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const SMOKE_MARKER = "[SMOKE][PROJECTS_TASKS]";

const FORBIDDEN_PATTERNS = [
  /sk-or-[a-z0-9]{8,}/i,
  /passwordHash/i,
  /sessionTokenHash/i,
  /-----BEGIN/i
];

let passed = 0;

function pass(label, detail = "") {
  passed++;
  console.log(`  PASS: ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail = "") {
  throw new Error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
}

function assert(condition, label, detail = "") {
  if (!condition) fail(label, detail);
  pass(label, detail);
}

function guardSecrets(json) {
  const text = JSON.stringify(json ?? "");
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      fail("secret leak detected in response");
    }
  }
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
  return { status: response.status, ok: response.ok, json };
}

async function login(email, password) {
  const res = await apiCall("POST", "/auth/login", { email, password });
  const token = res.json?.data?.session?.token ?? "";
  return { res, token };
}

function tomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);

  if (!ADMIN_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD env var is required");
  }

  // ── Health check ───────────────────────────────────────────────────────
  const health = await apiCall("GET", "/health");
  assert(
    health.ok && health.json?.data?.database?.status === "ready",
    "api health ready",
    `status=${health.status}`
  );

  // ── Admin auth ─────────────────────────────────────────────────────────
  const { res: loginRes, token } = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert(!!token, "admin login ok", `status=${loginRes.status}`);

  const smokeTs = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const projectName = `[SMOKE][PROJECTS] ${smokeTs}`;
  const taskTitle = `[SMOKE][TASKS] ${smokeTs}`;
  const dueDate = tomorrowDate();

  // ══════════════════════════════════════════════════════════════════════
  // PROJECTS
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n── PROJECTS ──\n");

  // P1: List projects (baseline)
  const listProjRes = await apiCall("GET", "/projects", undefined, token);
  guardSecrets(listProjRes.json);
  assert(listProjRes.ok, "P1 list projects ok", `status=${listProjRes.status}`);
  const baselineProjCount = listProjRes.json?.data?.projects?.length ?? 0;
  pass(`P1 baseline project count`, `count=${baselineProjCount}`);

  // P2: Create project
  const createProjRes = await apiCall(
    "POST",
    "/projects",
    { name: projectName, status: "Active" },
    token
  );
  guardSecrets(createProjRes.json);
  assert(createProjRes.status === 201, "P2 create project 201", `status=${createProjRes.status}`);
  const projectId = createProjRes.json?.data?.project?.id;
  assert(!!projectId, "P2 create project returns id");
  assert(
    createProjRes.json?.data?.project?.name === projectName,
    "P2 create project name matches"
  );
  assert(
    createProjRes.json?.data?.project?.status === "Active",
    "P2 create project status=Active"
  );

  // P3: Get project (detail)
  const getProjRes = await apiCall("GET", `/projects/${projectId}`, undefined, token);
  guardSecrets(getProjRes.json);
  assert(getProjRes.ok, "P3 get project by id ok", `status=${getProjRes.status}`);
  assert(
    getProjRes.json?.data?.project?.id === projectId,
    "P3 get project id matches"
  );

  // P4: Verify created project appears in list
  const listProjRes2 = await apiCall("GET", "/projects", undefined, token);
  guardSecrets(listProjRes2.json);
  assert(listProjRes2.ok, "P4 list projects after create ok");
  const foundProject = (listProjRes2.json?.data?.projects ?? []).find(
    (p) => p.id === projectId
  );
  assert(!!foundProject, "P4 created project appears in list");

  // P5: Update project (status=Paused + description)
  const updateProjRes = await apiCall(
    "PUT",
    `/projects/${projectId}`,
    { name: projectName, status: "Paused", description: "smoke-updated" },
    token
  );
  guardSecrets(updateProjRes.json);
  assert(updateProjRes.ok, "P5 update project ok", `status=${updateProjRes.status}`);
  assert(
    updateProjRes.json?.data?.project?.status === "Paused",
    "P5 update project status=Paused"
  );
  assert(
    updateProjRes.json?.data?.project?.description === "smoke-updated",
    "P5 update project description updated"
  );

  // ══════════════════════════════════════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n── TASKS ──\n");

  // T1: List tasks (baseline)
  const listTasksRes = await apiCall("GET", "/tasks", undefined, token);
  guardSecrets(listTasksRes.json);
  assert(listTasksRes.ok, "T1 list tasks ok", `status=${listTasksRes.status}`);
  const baselineTaskCount = listTasksRes.json?.data?.tasks?.length ?? 0;
  pass(`T1 baseline task count`, `count=${baselineTaskCount}`);

  // T2: Create task linked to smoke project
  const createTaskRes = await apiCall(
    "POST",
    "/tasks",
    {
      title: taskTitle,
      projectId,
      priority: "NORMAL",
      status: "TODO",
      dueDate,
      recurringType: "NONE"
    },
    token
  );
  guardSecrets(createTaskRes.json);
  assert(createTaskRes.status === 201, "T2 create task 201", `status=${createTaskRes.status}`);
  const taskId = createTaskRes.json?.data?.task?.id;
  assert(!!taskId, "T2 create task returns id");
  assert(
    createTaskRes.json?.data?.task?.title === taskTitle,
    "T2 create task title matches"
  );
  assert(
    createTaskRes.json?.data?.task?.projectId === projectId,
    "T2 create task linked to project"
  );
  assert(
    createTaskRes.json?.data?.task?.status === "TODO",
    "T2 create task status=TODO"
  );

  // T3: Get task (detail)
  const getTaskRes = await apiCall("GET", `/tasks/${taskId}`, undefined, token);
  guardSecrets(getTaskRes.json);
  assert(getTaskRes.ok, "T3 get task by id ok", `status=${getTaskRes.status}`);
  assert(getTaskRes.json?.data?.task?.id === taskId, "T3 get task id matches");

  // T4: Verify task appears in list
  const listTasksRes2 = await apiCall("GET", "/tasks", undefined, token);
  guardSecrets(listTasksRes2.json);
  assert(listTasksRes2.ok, "T4 list tasks after create ok");
  const foundTask = (listTasksRes2.json?.data?.tasks ?? []).find((t) => t.id === taskId);
  assert(!!foundTask, "T4 created task appears in list");

  // T5a: Update task status=IN_PROGRESS + priority=HIGH
  const updateTaskIPRes = await apiCall(
    "PUT",
    `/tasks/${taskId}`,
    { title: taskTitle, priority: "HIGH", status: "IN_PROGRESS", dueDate, recurringType: "NONE" },
    token
  );
  guardSecrets(updateTaskIPRes.json);
  assert(updateTaskIPRes.ok, "T5a update task status=IN_PROGRESS ok", `status=${updateTaskIPRes.status}`);
  assert(
    updateTaskIPRes.json?.data?.task?.status === "IN_PROGRESS",
    "T5a task status=IN_PROGRESS confirmed"
  );
  assert(
    updateTaskIPRes.json?.data?.task?.priority === "HIGH",
    "T5a task priority=HIGH confirmed"
  );

  // T5b: Update task status=DONE (required before archive)
  const updateTaskDoneRes = await apiCall(
    "PUT",
    `/tasks/${taskId}`,
    { title: taskTitle, priority: "HIGH", status: "DONE", dueDate, recurringType: "NONE" },
    token
  );
  guardSecrets(updateTaskDoneRes.json);
  assert(updateTaskDoneRes.ok, "T5b update task status=DONE ok");
  assert(
    updateTaskDoneRes.json?.data?.task?.status === "DONE",
    "T5b task status=DONE confirmed"
  );

  // T6: Archive task (requires DONE — API enforces TASK_ARCHIVE_BLOCKED otherwise)
  const archiveTaskRes = await apiCall("POST", `/tasks/${taskId}/archive`, undefined, token);
  guardSecrets(archiveTaskRes.json);
  assert(archiveTaskRes.ok, "T6 archive task ok", `status=${archiveTaskRes.status}`);
  assert(
    archiveTaskRes.json?.data?.task?.isArchived === true,
    "T6 task isArchived=true after archive"
  );

  // T7: Restore task
  const restoreTaskRes = await apiCall("POST", `/tasks/${taskId}/restore`, undefined, token);
  guardSecrets(restoreTaskRes.json);
  assert(restoreTaskRes.ok, "T7 restore task ok", `status=${restoreTaskRes.status}`);
  assert(
    restoreTaskRes.json?.data?.task?.isArchived === false,
    "T7 task isArchived=false after restore"
  );

  // ══════════════════════════════════════════════════════════════════════
  // PROJECT ARCHIVE / RESTORE
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n── PROJECT ARCHIVE/RESTORE ──\n");

  // P6: Archive project
  const archiveProjRes = await apiCall(
    "POST",
    `/projects/${projectId}/archive`,
    undefined,
    token
  );
  guardSecrets(archiveProjRes.json);
  assert(archiveProjRes.ok, "P6 archive project ok", `status=${archiveProjRes.status}`);
  assert(
    archiveProjRes.json?.data?.project?.isArchived === true,
    "P6 project isArchived=true after archive"
  );

  // P7: Restore project
  const restoreProjRes = await apiCall(
    "POST",
    `/projects/${projectId}/restore`,
    undefined,
    token
  );
  guardSecrets(restoreProjRes.json);
  assert(restoreProjRes.ok, "P7 restore project ok", `status=${restoreProjRes.status}`);
  assert(
    restoreProjRes.json?.data?.project?.isArchived === false,
    "P7 project isArchived=false after restore"
  );

  // ── Summary ────────────────────────────────────────────────────────────
  console.log(`\n${SMOKE_MARKER} PASS — ${passed} checks passed\n`);
  console.log("Lifecycle proven:");
  console.log("  Projects : list → create → get → list-verify → update(Paused) → archive → restore");
  console.log("  Tasks    : list → create(linked) → get → list-verify → update(IN_PROGRESS) → update(DONE) → archive → restore");
  console.log("\nNot applicable / not tested:");
  console.log("  — No client-linked project (clientId optional; not required for core lifecycle proof)");
  console.log("  — No browser UI proof (API-level proof sufficient for admin MVP foundation)\n");
}

main().catch((err) => {
  console.error(`\n${SMOKE_MARKER} FAIL — ${err.message}\n`);
  process.exit(1);
});
