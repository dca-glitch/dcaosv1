/**
 * Shared Puriva client portal boundary helpers for local smokes.
 * Uses AUTH_SEED_TEST_PASSWORD from env only — never hardcodes or logs credentials.
 */

import { PURIVA_CLIENT_PORTAL_USER_EMAIL } from "./puriva-local-setup.mjs";

export const PURIVA_PORTAL_FORBIDDEN_RESPONSE =
  /passwordHash|sessionTokenHash|storageKey|structuredInputJson|promptScaffold|INTERNAL ADMIN IMAGE PROMPT SCAFFOLD — NOT FOR CLIENT OR GENERATION USE|INTERNAL DRAFT SCAFFOLD — NOT APPROVED CLIENT COPY|openrouter|providerMetadata|workflowRunId|executionLog|tempPassword|private\/|\/api\/v1\/workflow-briefs|publication-handoff|execute-publication-handoff|prepare-release|finalize-release-package|PURIVA_MANUAL_METRICS_V1|PURIVA_FINANCE_ATTRIBUTION_V1|puriva_finance_attribution_seed|"itemMetrics"|"placeholderDisclaimer"|"adminSummaryNotes"|"verificationRequiredNotes"|"awaitingAnalyticsNote"|"invoicePlaceholderId"|"recurringInvoiceId"|"attributedAmountCents"|"financeEventSynced"|puriva_manual_metrics_seed/i;

export const PURIVA_PORTAL_FORBIDDEN_UI =
  /Publication handoff|Prepare WordPress drafts|structuredInputJson|INTERNAL ADMIN IMAGE PROMPT|INTERNAL DRAFT SCAFFOLD|storageKey|workflowRunId|executionLog|openrouter|providerMetadata|Execute release|Publish now/i;

export const PURIVA_PORTAL_FORBIDDEN_MONTHLY_REPORT_TITLE =
  /\[PURIVA_LOCAL_SETUP\]|PURIVA_[A-Z0-9_]+_V1|puriva_[a-z0-9_]+_seed/i;

export const PURIVA_PORTAL_FORBIDDEN_CLIENT_SETUP_MARKERS = PURIVA_PORTAL_FORBIDDEN_MONTHLY_REPORT_TITLE;

export const PURIVA_DRAFT_INTERNAL_LABEL = "INTERNAL DRAFT SCAFFOLD — NOT APPROVED CLIENT COPY";
export const PURIVA_IMAGE_INTERNAL_PROMPT_LABEL =
  "INTERNAL ADMIN IMAGE PROMPT SCAFFOLD — NOT FOR CLIENT OR GENERATION USE";

export function responseHasCredentialFields(text) {
  return /passwordHash|sessionTokenHash|tempPassword|applicationPassword|api[_-]?key/i.test(text ?? "");
}

export function assertPurivaClientPortalResponseSafe(record, label, response) {
  record(
    `${label} hides forbidden portal internals`,
    !PURIVA_PORTAL_FORBIDDEN_RESPONSE.test(response.text ?? ""),
    PURIVA_PORTAL_FORBIDDEN_RESPONSE.test(response.text ?? "") ? "forbidden pattern found" : "clean"
  );
  record(
    `${label} hides credential fields`,
    !responseHasCredentialFields(response.text ?? ""),
    responseHasCredentialFields(response.text ?? "") ? "credential field leaked" : "safe fields"
  );
}

function collectClientPortalMonthlyReportTitleCandidates(response) {
  const data = response.body?.data ?? {};
  const reports = Array.isArray(data.monthlyReports)
    ? data.monthlyReports
    : data.monthlyReport
      ? [data.monthlyReport]
      : [];

  return reports.flatMap((report) => [report?.displayTitle, report?.title]).filter(Boolean);
}

export function assertPurivaClientPortalSetupMarkersAbsent(record, label, response) {
  const text = response.text ?? "";
  record(
    `${label} omits [PURIVA_LOCAL_SETUP]`,
    !text.includes("[PURIVA_LOCAL_SETUP]"),
    text.includes("[PURIVA_LOCAL_SETUP]") ? "setup marker leaked" : "clean"
  );
  record(
    `${label} omits PURIVA version markers`,
    !/PURIVA_[A-Z0-9_]+_V1/.test(text),
    /PURIVA_[A-Z0-9_]+_V1/.test(text) ? "version marker leaked" : "clean"
  );
}

export function assertClientPortalMonthlyReportTitlesSanitized(record, label, response) {
  const titles = collectClientPortalMonthlyReportTitleCandidates(response);
  const leakedTitle = titles.find((title) => PURIVA_PORTAL_FORBIDDEN_CLIENT_SETUP_MARKERS.test(title));
  record(
    `${label} sanitizes monthly report titles`,
    !leakedTitle,
    leakedTitle ? `marker in title: ${leakedTitle}` : titles.length > 0 ? "clean" : "no titles"
  );
  assertPurivaClientPortalSetupMarkersAbsent(record, `${label} monthly report payload`, response);
}

export function assertClientPortalDeliverySummarySanitized(record, label, response) {
  const marketIntelligence = response.body?.data?.deliverySummary?.marketIntelligence ?? null;
  const title = marketIntelligence?.displayTitle ?? marketIntelligence?.title ?? "";
  record(
    `${label} sanitizes MI handoff title`,
    typeof title === "string" && title.length > 0 && !PURIVA_PORTAL_FORBIDDEN_CLIENT_SETUP_MARKERS.test(title),
    title || "missing"
  );
  assertPurivaClientPortalSetupMarkersAbsent(record, label, response);
}

/** Raw/admin monthly report fields that must never appear on client list/detail/download. */
export const PURIVA_MONTHLY_REPORT_FORBIDDEN_RESPONSE =
  /storageKey|adminSummaryNotes|miHandoffId|miContextDraft|"reportJson"|workflowRunId|executionLog|publicationHandoff|contextPreview|selectedSourcesJson|resultSnapshot|executionLogPreview|"itemMetrics"|"placeholderDisclaimer"|"verificationRequiredNotes"|"awaitingAnalyticsNote"|importedByUserId|approvedByUserId|aiDeliveryMonthlyMetricSnapshots|puriva_manual_metrics_seed|PURIVA_MANUAL_METRICS_V1/i;

/** Legacy ClientMonthlyBrief (/briefs) — compatibility boundary, not deprecation proof. */
export const PURIVA_LEGACY_BRIEFS_FORBIDDEN_RESPONSE =
  /storageKey|workflowRunId|executionLog|"planJson"|"reportJson"|publicationHandoff|contextPreview|selectedSourcesJson|resultSnapshot|executionLogPreview|knowledgeContext|contextSection|approvedKnowledgeSection/i;

export function assertClientPortalMonthlyReportBoundaryForbidden(record, label, response) {
  const text = response.text ?? "";
  record(
    `${label} omits forbidden monthly report internals`,
    !PURIVA_MONTHLY_REPORT_FORBIDDEN_RESPONSE.test(text),
    PURIVA_MONTHLY_REPORT_FORBIDDEN_RESPONSE.test(text) ? "forbidden pattern found" : "clean"
  );
  record(
    `${label} omits snapshot notes field`,
    !/"notes"\s*:/.test(text),
    /"notes"\s*:/.test(text) ? "snapshot notes leaked" : "clean"
  );
  record(
    `${label} hides credential fields`,
    !responseHasCredentialFields(text),
    responseHasCredentialFields(text) ? "credential field leaked" : "safe fields"
  );
}

export function assertClientPortalMonthlyReportProvenanceAllowed(record, label, response) {
  const performanceSummary = response.body?.data?.performanceSummary ?? null;
  if (!performanceSummary || typeof performanceSummary !== "object") {
    record(`${label} allows client-safe provenance fields`, true, "SKIPPED: no performanceSummary");
    return;
  }

  if ("sourceType" in performanceSummary) {
    record(
      `${label} allows client-safe sourceType provenance`,
      typeof performanceSummary.sourceType === "string" && performanceSummary.sourceType.length > 0,
      performanceSummary.sourceType ?? "missing"
    );
  } else {
    record(`${label} allows client-safe sourceType provenance`, true, "SKIPPED: sourceType absent");
  }

  const hasManualProvenance =
    performanceSummary.manualSource === true ||
    (typeof performanceSummary.disclaimer === "string" && performanceSummary.disclaimer.length > 0) ||
    performanceSummary.placeholderOnly === true;

  record(
    `${label} allows manual/placeholder provenance when present`,
    hasManualProvenance || !("manualSource" in performanceSummary),
    hasManualProvenance
      ? `manualSource=${performanceSummary.manualSource ?? "absent"}`
      : "no manual provenance fields"
  );
}

export function assertLegacyClientBriefsResponseSafe(record, label, response) {
  if (response.status === 403) {
    record(`${label} compatibility boundary`, true, "SKIPPED: client forbidden from /briefs");
    return;
  }
  if (response.status !== 200) {
    record(`${label} compatibility boundary`, false, `unexpected HTTP ${response.status}`);
    return;
  }

  const text = response.text ?? "";
  const briefs = Array.isArray(response.body?.data) ? response.body.data : [];
  record(
    `${label} reachable`,
    response.body?.ok === true,
    `${briefs.length} brief(s)`
  );
  record(
    `${label} omits forbidden workflow/storage internals`,
    !PURIVA_LEGACY_BRIEFS_FORBIDDEN_RESPONSE.test(text),
    PURIVA_LEGACY_BRIEFS_FORBIDDEN_RESPONSE.test(text) ? "forbidden pattern found" : "clean"
  );
  record(
    `${label} hides credential fields`,
    !responseHasCredentialFields(text),
    responseHasCredentialFields(text) ? "credential field leaked" : "safe fields"
  );
  if (briefs.length === 0) {
    record(`${label} legacy data present`, true, "SKIPPED: no legacy brief rows (boundary still checked)");
  }
}

async function login(request, email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

async function changePassword(request, token, oldPassword, newPassword) {
  return request("/auth/change-password", {
    method: "POST",
    token,
    body: { oldPassword, newPassword }
  });
}

/**
 * Ensures puriva@puriva.id can authenticate with portalPassword (AUTH_SEED_TEST_PASSWORD).
 * Creates the portal user via admin API when missing; syncs password only when login fails.
 */
export async function ensurePurivaClientPortalAuth({
  request,
  adminToken,
  portalPassword,
  clientId,
  email = PURIVA_CLIENT_PORTAL_USER_EMAIL,
  log = () => {}
}) {
  if (typeof portalPassword !== "string" || portalPassword.length < 8) {
    throw new Error("Puriva portal password must be provided via env and be at least 8 characters.");
  }

  const directLogin = await login(request, email, portalPassword);
  if (directLogin.status === 200 && directLogin.body?.data?.session?.token) {
    return {
      token: directLogin.body.data.session.token,
      email,
      userId: directLogin.body.data.user?.id ?? null,
      created: { user: false, passwordSynced: false }
    };
  }

  const membersResponse = await request("/tenants/current/members", { token: adminToken });
  const members = membersResponse.body?.data?.members ?? [];
  let portalUser =
    members.find(
      (entry) =>
        typeof entry.user?.email === "string" && entry.user.email.trim().toLowerCase() === email.toLowerCase()
    ) ?? null;

  let tempPassword = null;
  let createdUser = false;

  if (!portalUser?.user?.id) {
    const createResponse = await request("/auth/create-user", {
      method: "POST",
      token: adminToken,
      body: {
        email,
        name: "Puriva Portal",
        roleKey: "client",
        clientId
      }
    });

    if (createResponse.status === 201 && createResponse.body?.data?.userId) {
      portalUser = { user: { id: createResponse.body.data.userId, email } };
      tempPassword = createResponse.body.data.tempPassword;
      createdUser = true;
      log("created puriva portal user for local boundary smoke");
    } else if (createResponse.status === 409) {
      log("puriva portal user exists outside tenant — API boundary proof only");
      return null;
    } else {
      throw new Error(`Puriva portal user create failed with HTTP ${createResponse.status}.`);
    }
  } else {
    const resetResponse = await request(`/auth/reset-password/${portalUser.user.id}`, {
      method: "POST",
      token: adminToken
    });
    if (resetResponse.status !== 200 || typeof resetResponse.body?.data?.tempPassword !== "string") {
      throw new Error(`Puriva portal password reset failed with HTTP ${resetResponse.status}.`);
    }
    tempPassword = resetResponse.body.data.tempPassword;
    log("synced puriva portal password for local boundary smoke");
  }

  if (!tempPassword) {
    return null;
  }

  const tempLogin = await login(request, email, tempPassword);
  const tempToken = tempLogin.body?.data?.session?.token ?? null;
  if (tempLogin.status !== 200 || !tempToken) {
    throw new Error("Puriva portal temporary login failed after user ensure.");
  }

  if (tempPassword === portalPassword) {
    throw new Error("Puriva portal temporary password cannot match target env password.");
  }

  const changeResponse = await changePassword(request, tempToken, tempPassword, portalPassword);
  if (changeResponse.status !== 200 || changeResponse.body?.ok !== true) {
    throw new Error(`Puriva portal password sync failed with HTTP ${changeResponse.status}.`);
  }

  const finalLogin = await login(request, email, portalPassword);
  const finalToken = finalLogin.body?.data?.session?.token ?? null;
  if (finalLogin.status !== 200 || !finalToken) {
    throw new Error("Puriva portal login failed after password sync.");
  }

  if (!createdUser && clientId) {
    const accessListResponse = await request(`/clients/${clientId}/users`, { token: adminToken });
    const accessUsers = accessListResponse.body?.data?.users ?? [];
    const hasAccess = accessUsers.some((entry) => entry.user?.id === portalUser.user.id);
    if (!hasAccess) {
      const grantResponse = await request(`/clients/${clientId}/users`, {
        method: "POST",
        token: adminToken,
        body: { userId: portalUser.user.id }
      });
      if (grantResponse.status !== 201 || grantResponse.body?.ok !== true) {
        throw new Error(`Puriva portal client access grant failed with HTTP ${grantResponse.status}.`);
      }
      log("granted puriva portal client access");
    }
  }

  return {
    token: finalToken,
    email,
    userId: portalUser.user.id,
    created: { user: createdUser, passwordSynced: true }
  };
}

export function assertClientForbiddenAdminPath(record, label, response, method = "GET") {
  if (method === "GET" && label === "release package admin") {
    const safeRead =
      response.status === 200 &&
      response.body?.data?.releasePackage == null &&
      !PURIVA_PORTAL_FORBIDDEN_RESPONSE.test(response.text ?? "");
    record(
      "client admin release package read blocked or safe",
      response.status === 401 || response.status === 403 || safeRead,
      safeRead ? "200 with null releasePackage" : `${response.status}`
    );
    return;
  }

  record(
    `client blocked from ${label}`,
    response.status === 401 || response.status === 403,
    `${response.status}`
  );
}

export async function resolvePurivaClientPortalAuth({
  request,
  adminToken,
  portalPassword,
  clientId,
  log = () => {}
}) {
  try {
    return await ensurePurivaClientPortalAuth({
      request,
      adminToken,
      portalPassword,
      clientId,
      log
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    return null;
  }
}
