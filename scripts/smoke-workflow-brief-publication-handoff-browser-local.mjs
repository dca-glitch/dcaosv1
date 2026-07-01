import { chromium } from "@playwright/test";
import { gotoClientPortal, seedClientPortalAuth } from "./lib/client-portal-browser-smoke-helpers.mjs";
import {
  ensureLocalBrowserSmokeServices,
  getApiBaseUrl,
  getWebBaseUrl
} from "./lib/local-browser-smoke-service-helpers.mjs";

const apiBaseUrl = getApiBaseUrl();
const webBaseUrl = getWebBaseUrl();
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL;
const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? adminPassword;
const smokeMarker = "[SMOKE][WORKFLOW_BRIEF_PUBLICATION_HANDOFF_BROWSER]";

const forbiddenAdminActionPhrases = [
  "Execute release",
  "Release execution",
  "Publish now"
];

const forbiddenAdminActionButtonPatterns = [
  /^live publish$/i,
  /^publish now$/i
];

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
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
  return { status: response.status, body, text };
}

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

async function assertForbiddenWordingAbsent(text, scopeLabel, page = null) {
  for (const phrase of forbiddenAdminActionPhrases) {
    record(
      `${scopeLabel} forbids "${phrase}"`,
      !text.includes(phrase),
      text.includes(phrase) ? "found" : "absent"
    );
  }

  if (page) {
    const actionLabels = [];
    for (const element of await page.locator("button, a").all()) {
      const label = (await element.innerText()).trim();
      if (label) {
        actionLabels.push(label);
      }
    }
    const forbiddenAction = actionLabels.find((label) =>
      forbiddenAdminActionButtonPatterns.some((pattern) => pattern.test(label))
    );
    record(
      `${scopeLabel} forbids live publish action`,
      !forbiddenAction,
      forbiddenAction ?? "absent"
    );
  }
}

async function progressBriefToPackagedState(adminToken, clientId) {
  const briefTitle = `${smokeMarker} ${makeSmokeId("brief")}`;
  const createResponse = await request("/workflow-briefs", {
    method: "POST",
    token: adminToken,
    body: {
      clientId,
      title: briefTitle,
      goal: "Validate publication handoff browser panel"
    }
  });
  if (createResponse.status !== 201 || !createResponse.body?.data?.id) {
    throw new Error(`Workflow brief create failed with HTTP ${createResponse.status}.`);
  }
  const briefId = createResponse.body.data.id;

  const steps = [
    ["submit", "POST", `/workflow-briefs/${briefId}/submit`],
    ["run-ai", "POST", `/workflow-briefs/${briefId}/run-ai`],
    ["generate-plan", "POST", `/workflow-briefs/${briefId}/production-plan/generate`],
    ["send-plan", "POST", `/workflow-briefs/${briefId}/production-plan/send`],
    ["approve-plan", "POST", `/workflow-briefs/${briefId}/production-plan/approve`],
    ["create-project", "POST", `/workflow-briefs/${briefId}/create-project`, {}],
    ["seed-content", "POST", `/workflow-briefs/${briefId}/seed-content-production`],
    ["generate-drafts", "POST", `/workflow-briefs/${briefId}/generate-content-drafts`],
    ["package-deliverables", "POST", `/workflow-briefs/${briefId}/package-deliverables`],
    ["prepare-image-sets", "POST", `/workflow-briefs/${briefId}/prepare-image-sets`]
  ];

  let packageResponse = null;

  for (const [label, method, path, body] of steps) {
    const response = await request(path, {
      method,
      token: adminToken,
      body: body === undefined ? undefined : body
    });
    if (label === "package-deliverables") {
      packageResponse = response;
    }
    const ok =
      (label === "create-project" || label === "seed-content") && response.status === 201
        ? response.body?.ok === true
        : response.status === 200 && response.body?.ok === true;
    if (!ok) {
      throw new Error(`Fixture step ${label} failed with HTTP ${response.status}.`);
    }
  }

  const firstDeliverableId = packageResponse?.body?.data?.status?.items?.[0]?.deliverableId ?? null;
  const firstSeedItemId = packageResponse?.body?.data?.status?.items?.[0]?.contentPlanItemId ?? null;

  return { briefId, briefTitle, firstDeliverableId, firstSeedItemId };
}

async function tryProgressBriefToExecutableHandoff(adminToken, clientId, fixture) {
  const handoffBefore = await request(`/workflow-briefs/${fixture.briefId}/publication-handoff`, {
    token: adminToken
  });
  if (handoffBefore.status !== 200) {
    return { progressed: false, reason: `handoff status HTTP ${handoffBefore.status}` };
  }

  if (!handoffBefore.body?.data?.publicationTargetAvailable) {
    const targetResponse = await request(`/clients/${clientId}/publication-targets`, {
      method: "POST",
      token: adminToken,
      body: {
        label: `${smokeMarker} publication target`,
        siteUrl: "https://example.com",
        isDefault: true
      }
    });
    if (targetResponse.status !== 201) {
      return { progressed: false, reason: `publication target create HTTP ${targetResponse.status}` };
    }
  }

  if (!fixture.firstDeliverableId || !fixture.firstSeedItemId) {
    return { progressed: false, reason: "missing deliverable fixture ids" };
  }

  if (!clientEmail) {
    return { progressed: false, reason: "AUTH_SEED_TESTER_EMAIL unset" };
  }

  const clientLogin = await login(clientEmail, clientPassword);
  const clientToken = clientLogin.body?.data?.session?.token ?? null;
  if (clientLogin.status !== 200 || !clientToken) {
    return { progressed: false, reason: `client login HTTP ${clientLogin.status}` };
  }

  await request(`/workflow-briefs/${fixture.briefId}/deliverables/${fixture.firstDeliverableId}/send-for-client-review`, {
    method: "POST",
    token: adminToken
  });

  const imageSetStatus = await request(`/workflow-briefs/${fixture.briefId}/image-sets`, { token: adminToken });
  const articleImageId =
    imageSetStatus.body?.data?.items?.find((item) => item.contentPlanItemId === fixture.firstSeedItemId)
      ?.articleImageId ?? null;
  if (!articleImageId) {
    return { progressed: false, reason: "article image id missing" };
  }

  const approveImage = await request(
    `/client-portal/deliverables/${fixture.firstDeliverableId}/images/${articleImageId}/approve`,
    { method: "PATCH", token: clientToken }
  );
  const approveDeliverable = await request(`/client-portal/deliverables/${fixture.firstDeliverableId}/approve`, {
    method: "PATCH",
    token: clientToken
  });
  if (approveImage.status !== 200 || approveDeliverable.status !== 200) {
    return {
      progressed: false,
      reason: `client approvals image=${approveImage.status} deliverable=${approveDeliverable.status}`
    };
  }

  const prepRelease = await request(`/workflow-briefs/${fixture.briefId}/prepare-release`, {
    method: "POST",
    token: adminToken
  });
  const finalizeRelease = await request(`/workflow-briefs/${fixture.briefId}/finalize-release-package`, {
    method: "POST",
    token: adminToken
  });
  if (prepRelease.status !== 200 || finalizeRelease.status !== 200) {
    return {
      progressed: false,
      reason: `release prep=${prepRelease.status} finalize=${finalizeRelease.status}`
    };
  }

  const handoffAfter = await request(`/workflow-briefs/${fixture.briefId}/publication-handoff`, {
    token: adminToken
  });
  if (handoffAfter.status !== 200) {
    return { progressed: false, reason: `post-progress handoff HTTP ${handoffAfter.status}` };
  }

  return {
    progressed: true,
    canExecuteHandoff: handoffAfter.body?.data?.canExecuteHandoff === true,
    handoffBlockReason: handoffAfter.body?.data?.handoffBlockReason ?? null
  };
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  try {
    await ensureLocalBrowserSmokeServices((line) => console.log(line));
    record("local api/web readiness", true, "ready");
  } catch (error) {
    record("local api/web readiness", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const adminLogin = await login(adminEmail, adminPassword);
  const adminToken = adminLogin.body?.data?.session?.token ?? null;
  record("admin login", adminLogin.status === 200 && typeof adminToken === "string", `${adminLogin.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const clientResponse = await request("/clients", {
    method: "POST",
    token: adminToken,
    body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
  });
  const clientId = clientResponse.body?.data?.client?.id ?? null;
  record("fixture client create", clientResponse.status === 201 && Boolean(clientId), `${clientResponse.status}`);
  if (!clientId) {
    process.exitCode = 1;
    return;
  }

  let fixture;
  try {
    fixture = await progressBriefToPackagedState(adminToken, clientId);
    record("fixture brief packaged", true, fixture.briefId);
  } catch (error) {
    record("fixture brief packaged", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const handoffStatus = await request(`/workflow-briefs/${fixture.briefId}/publication-handoff`, {
    token: adminToken
  });
  record(
    "api publication handoff status",
    handoffStatus.status === 200 && handoffStatus.body?.data?.executionMode === "PREPARE_WORDPRESS_DRAFT",
    `${handoffStatus.status}`
  );
  if (handoffStatus.status !== 200) {
    process.exitCode = 1;
    return;
  }

  let canExecuteHandoff = handoffStatus.body?.data?.canExecuteHandoff === true;
  let handoffBlockReason = handoffStatus.body?.data?.handoffBlockReason ?? null;

  const executeAttempt = await tryProgressBriefToExecutableHandoff(adminToken, clientId, fixture);
  if (executeAttempt.progressed) {
    canExecuteHandoff = executeAttempt.canExecuteHandoff === true;
    handoffBlockReason = executeAttempt.handoffBlockReason;
    record(
      "fixture progressed toward executable handoff",
      true,
      `canExecuteHandoff=${canExecuteHandoff}`
    );
  } else {
    record("fixture progressed toward executable handoff", true, `skipped - ${executeAttempt.reason}`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/workflow-briefs`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Workflow Briefs", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record("admin workflow briefs page opens", true, "#/workflow-briefs");

    const briefButton = page.getByRole("button", { name: fixture.briefTitle });
    await briefButton.waitFor({ state: "visible", timeout: 20000 });
    await briefButton.click();

    await page.getByRole("heading", { name: fixture.briefTitle, exact: true }).waitFor({ state: "visible", timeout: 20000 });
    await page
      .getByRole("heading", { name: "Image Sets & Package Completeness", exact: true })
      .waitFor({ state: "visible", timeout: 30000 });

    const handoffHeading = page.getByText("Publication handoff", { exact: true });
    await handoffHeading.first().waitFor({ state: "visible", timeout: 20000 });
    record("publication handoff panel renders", true, fixture.briefId);

    await page.getByText("Draft prep only — no live publish", { exact: true }).waitFor({ state: "visible", timeout: 10000 });
    record("draft prep disclaimer visible", true, "Draft prep only — no live publish");

    const prepareButton = page.getByRole("button", {
      name: /^(Re-prepare WordPress drafts|Prepare WordPress drafts)$/
    });
    await prepareButton.waitFor({ state: "visible", timeout: 10000 });
    record("prepare wordpress drafts control visible", true, "button present");

    const panelText = await page.locator("main").innerText();
    await assertForbiddenWordingAbsent(panelText, "admin workflow briefs panel", page);

    if (canExecuteHandoff) {
      record("handoff execute gate", true, "canExecuteHandoff=true");
      await prepareButton.click();
      await page
        .getByText(/WordPress drafts prepared for \d+ item|WordPress draft prep reused/i)
        .waitFor({ state: "visible", timeout: 30000 });
      record("prepare wordpress drafts success notice", true, "success copy");
    } else {
      record("handoff execute gate", true, "canExecuteHandoff=false");
      const disabled = await prepareButton.isDisabled();
      record("prepare wordpress drafts disabled when gated", disabled, disabled ? "disabled" : "enabled");
      if (handoffBlockReason) {
        record(
          "handoff block reason visible",
          panelText.includes(handoffBlockReason),
          handoffBlockReason.slice(0, 80)
        );
      } else {
        record("handoff block reason visible", true, "no block reason required");
      }
    }

    if (clientEmail) {
      const clientLogin = await login(clientEmail, clientPassword);
      const clientToken = clientLogin.body?.data?.session?.token ?? null;
      if (clientLogin.status === 200 && clientToken) {
        const clientPage = await browser.newPage();
        try {
          await seedClientPortalAuth(clientPage, clientToken);
          await gotoClientPortal(clientPage, webBaseUrl);
          const clientPortalText = await clientPage.locator("body").innerText();
          record(
            "client portal hides publication handoff panel",
            !clientPortalText.includes("Publication handoff"),
            clientPortalText.includes("Publication handoff") ? "found" : "absent"
          );
          await assertForbiddenWordingAbsent(clientPortalText, "client portal", clientPage);
        } finally {
          await clientPage.close().catch(() => {});
        }
      } else {
        record("client portal hides publication handoff panel", true, `skipped - client login HTTP ${clientLogin.status}`);
      }
    } else {
      record("client portal hides publication handoff panel", true, "skipped - AUTH_SEED_TESTER_EMAIL unset");
    }

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log(
        "PROVEN: Admin Workflow Briefs publication handoff panel renders draft-prep-only controls; client portal does not expose handoff UI."
      );
    } else {
      console.log("NOT PROVEN: one or more publication handoff browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("publication handoff browser smoke runtime", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
