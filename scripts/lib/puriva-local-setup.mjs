/**
 * Idempotent local/admin foundation for Puriva (puriva.id).
 * No credentials, no live publish, no external provider calls.
 */

import {
  buildPurivaWorkflowBriefFoundationInput,
  ensurePurivaMarketIntelligenceApiSeed,
  purivaMarketIntelligenceProjectTitle,
  PURIVA_MARKET_INTELLIGENCE_VERSION,
  validatePurivaMarketIntelligenceContext,
  workflowBriefFoundationMatches
} from "./puriva-market-intelligence.mjs";
import {
  PURIVA_SERVICE_TAXONOMY_VERSION,
  validatePurivaServiceTaxonomy
} from "./puriva-service-taxonomy.mjs";

export const PURIVA_SETUP_MARKER = "[PURIVA_LOCAL_SETUP]";

export const PURIVA_PROFILE = {
  name: "Puriva",
  website: "https://puriva.id",
  country: "Indonesia",
  contactPerson: "Puriva Clinic",
  email: "hello@puriva.id",
  clientKind: "AGENCY_CLIENT"
};

export const PURIVA_BUSINESS_NOTES = {
  goal: "Licensed aesthetic clinic in Bali serving international medical tourism clients.",
  businessContext:
    "Puriva is a licensed aesthetic clinic in Bali, Indonesia offering Wegovy/semaglutide weight management, stem cell therapy, and general aesthetic services.",
  targetAudience: "International and domestic clients seeking medical tourism and aesthetic treatments in Bali.",
  offerContext:
    "Wegovy/semaglutide weight management, stem cell therapy, general aesthetic services, Bali medical tourism packages.",
  locationContext: "Bali, Indonesia (puriva.id)"
};

export const PURIVA_PUBLICATION_TARGET = {
  label: "Puriva WordPress (draft prep only)",
  siteUrl: "https://puriva.id",
  siteSlug: "puriva",
  isDefault: true
};

export const PURIVA_CLIENT_PORTAL_USER_EMAIL = "puriva@puriva.id";

export const PURIVA_WORKFLOW_BRIEF_TITLE = `${PURIVA_SETUP_MARKER} Workflow brief foundation`;

export function purivaMonthlyProjectName(targetMonth) {
  return `Puriva SEO / Content — ${targetMonth}`;
}

export function currentTargetMonth(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function normalizeHostname(website) {
  if (!website || typeof website !== "string") {
    return null;
  }
  try {
    const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isPurivaClient(client) {
  if (!client || client.isArchived) {
    return false;
  }
  const nameMatch = typeof client.name === "string" && client.name.trim().toLowerCase() === "puriva";
  const hostMatch = normalizeHostname(client.website) === "puriva.id";
  return nameMatch || hostMatch;
}

export function responseHasSecrets(text) {
  return /passwordHash|sessionTokenHash|applicationPassword|application_password|api[_-]?key|secret|bearer\s+/i.test(
    text ?? ""
  );
}

export async function ensurePurivaLocalSetup({
  request,
  token,
  targetMonth = currentTargetMonth(),
  log = () => {}
}) {
  const actions = [];
  const result = {
    client: null,
    publicationTarget: null,
    aiDeliveryProject: null,
    workflowBrief: null,
    clientAccess: null,
    created: {
      client: false,
      publicationTarget: false,
      aiDeliveryProject: false,
      workflowBrief: false,
      clientAccess: false,
      foundationAttached: false,
      marketIntelligenceProject: false,
      marketIntelligenceHandoffApplied: false
    },
    skipped: [],
    actions
  };

  function note(action, detail = "") {
    const entry = detail ? `${action}: ${detail}` : action;
    actions.push(entry);
    log(entry);
  }

  const clientsResponse = await request("/clients", { token });
  if (clientsResponse.status !== 200 || clientsResponse.body?.ok !== true) {
    throw new Error(`Client list failed with HTTP ${clientsResponse.status}.`);
  }

  const clients = clientsResponse.body?.data?.clients ?? [];
  let client = clients.find((entry) => isPurivaClient(entry)) ?? null;

  if (!client) {
    const createResponse = await request("/clients", {
      method: "POST",
      token,
      body: PURIVA_PROFILE
    });
    if (createResponse.status !== 201 || createResponse.body?.ok !== true) {
      throw new Error(`Puriva client create failed with HTTP ${createResponse.status}.`);
    }
    client = createResponse.body.data?.client ?? null;
    result.created.client = true;
    note("created client", client?.id ?? "missing");
  } else {
    const updateResponse = await request(`/clients/${client.id}`, {
      method: "PUT",
      token,
      body: PURIVA_PROFILE
    });
    if (updateResponse.status !== 200 || updateResponse.body?.ok !== true) {
      throw new Error(`Puriva client update failed with HTTP ${updateResponse.status}.`);
    }
    client = updateResponse.body.data?.client ?? client;
    note("reused client", client.id);
  }

  if (!client?.id) {
    throw new Error("Puriva client id missing after ensure.");
  }
  result.client = client;

  const targetsResponse = await request(`/clients/${client.id}/publication-targets`, { token });
  if (targetsResponse.status !== 200 || targetsResponse.body?.ok !== true) {
    throw new Error(`Publication target list failed with HTTP ${targetsResponse.status}.`);
  }

  const targets = targetsResponse.body?.data?.publicationTargets ?? [];
  let publicationTarget =
    targets.find((entry) => normalizeHostname(entry.siteUrl) === "puriva.id") ??
    targets.find((entry) => entry.label === PURIVA_PUBLICATION_TARGET.label) ??
    null;

  if (!publicationTarget) {
    const createTargetResponse = await request(`/clients/${client.id}/publication-targets`, {
      method: "POST",
      token,
      body: PURIVA_PUBLICATION_TARGET
    });
    if (createTargetResponse.status !== 201 || createTargetResponse.body?.ok !== true) {
      throw new Error(`Puriva publication target create failed with HTTP ${createTargetResponse.status}.`);
    }
    publicationTarget = createTargetResponse.body.data?.publicationTarget ?? null;
    result.created.publicationTarget = true;
    note("created publication target", publicationTarget?.id ?? "missing");
  } else {
    note("reused publication target", publicationTarget.id);
  }

  if (!publicationTarget?.id) {
    throw new Error("Puriva publication target id missing after ensure.");
  }
  result.publicationTarget = publicationTarget;

  const credentialStatus = await request(
    `/clients/${client.id}/publication-targets/${publicationTarget.id}/credentials`,
    { token }
  );
  if (credentialStatus.status !== 200 || credentialStatus.body?.ok !== true) {
    throw new Error(`Puriva credential status failed with HTTP ${credentialStatus.status}.`);
  }
  if (credentialStatus.body?.data?.configured === true) {
    note("publication target credentials already configured", "left unchanged");
  } else {
    note("publication target credentials not configured", "draft-prep placeholder only");
  }

  const projectsResponse = await request("/ai-delivery-projects", { token });
  if (projectsResponse.status !== 200 || projectsResponse.body?.ok !== true) {
    throw new Error(`AI delivery project list failed with HTTP ${projectsResponse.status}.`);
  }

  const projectName = purivaMonthlyProjectName(targetMonth);
  const projects = projectsResponse.body?.data?.aiDeliveryProjects ?? [];
  let aiDeliveryProject =
    projects.find(
      (entry) => entry.clientId === client.id && entry.name === projectName && entry.isArchived !== true
    ) ?? null;

  if (!aiDeliveryProject) {
    const createProjectResponse = await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth
      }
    });
    if (createProjectResponse.status !== 201 || createProjectResponse.body?.ok !== true) {
      throw new Error(`Puriva AI delivery project create failed with HTTP ${createProjectResponse.status}.`);
    }
    aiDeliveryProject = createProjectResponse.body.data?.aiDeliveryProject ?? null;
    result.created.aiDeliveryProject = true;
    note("created ai delivery project", aiDeliveryProject?.id ?? "missing");
  } else {
    note("reused ai delivery project", aiDeliveryProject.id);
  }

  if (!aiDeliveryProject?.id) {
    throw new Error("Puriva AI delivery project id missing after ensure.");
  }
  result.aiDeliveryProject = aiDeliveryProject;

  const briefsResponse = await request(`/workflow-briefs?clientId=${encodeURIComponent(client.id)}`, { token });
  if (briefsResponse.status !== 200 || briefsResponse.body?.ok !== true) {
    throw new Error(`Workflow brief list failed with HTTP ${briefsResponse.status}.`);
  }

  const briefs = briefsResponse.body?.data ?? [];
  let workflowBrief =
    briefs.find((entry) => typeof entry.title === "string" && entry.title === PURIVA_WORKFLOW_BRIEF_TITLE) ?? null;

  if (!workflowBrief) {
    const createBriefResponse = await request("/workflow-briefs", {
      method: "POST",
      token,
      body: {
        clientId: client.id,
        title: PURIVA_WORKFLOW_BRIEF_TITLE,
        ...PURIVA_BUSINESS_NOTES
      }
    });
    if (createBriefResponse.status !== 201 || createBriefResponse.body?.ok !== true) {
      throw new Error(`Puriva workflow brief create failed with HTTP ${createBriefResponse.status}.`);
    }
    workflowBrief = createBriefResponse.body.data ?? null;
    result.created.workflowBrief = true;
    note("created workflow brief", workflowBrief?.id ?? "missing");
  } else {
    note("reused workflow brief", workflowBrief.id);
  }

  if (!workflowBrief?.id) {
    throw new Error("Puriva workflow brief id missing after ensure.");
  }
  result.workflowBrief = workflowBrief;

  const taxonomyValidation = validatePurivaServiceTaxonomy();
  if (!taxonomyValidation.ok) {
    throw new Error(`Puriva service taxonomy invalid: ${taxonomyValidation.errors.join("; ")}`);
  }

  const miValidation = validatePurivaMarketIntelligenceContext();
  if (!miValidation.ok) {
    throw new Error(`Puriva market intelligence invalid: ${miValidation.errors.join("; ")}`);
  }

  const miSeed = await ensurePurivaMarketIntelligenceApiSeed({
    request,
    token,
    client,
    aiDeliveryProject,
    targetMonth,
    log: note
  });
  result.marketIntelligence = {
    version: PURIVA_MARKET_INTELLIGENCE_VERSION,
    projectId: miSeed.miProject.id,
    projectTitle: purivaMarketIntelligenceProjectTitle(targetMonth),
    handoffId: miSeed.handoff.id,
    handoffStatus: miSeed.handoff.handoffStatus,
    serviceCategorySummaryCount: miSeed.context.serviceCategorySummaries.length,
    audienceSegmentCount: miSeed.context.audienceSegments.length
  };
  result.created.marketIntelligenceProject = miSeed.created.miProject;
  result.created.marketIntelligenceHandoffApplied = miSeed.created.handoffApplied;

  const expectedStructuredInput = buildPurivaWorkflowBriefFoundationInput();
  let briefDetailResponse = await request(`/workflow-briefs/${workflowBrief.id}`, { token });
  if (briefDetailResponse.status !== 200 || briefDetailResponse.body?.ok !== true) {
    throw new Error(`Workflow brief detail failed with HTTP ${briefDetailResponse.status}.`);
  }

  let briefDetail = briefDetailResponse.body.data ?? workflowBrief;
  if (workflowBriefFoundationMatches(briefDetail.structuredInputJson)) {
    note("reused workflow brief foundation", `${PURIVA_SERVICE_TAXONOMY_VERSION} + ${PURIVA_MARKET_INTELLIGENCE_VERSION}`);
  } else {
    const patchResponse = await request(`/workflow-briefs/${workflowBrief.id}`, {
      method: "PATCH",
      token,
      body: {
        structuredInputJson: expectedStructuredInput
      }
    });
    if (patchResponse.status !== 200 || patchResponse.body?.ok !== true) {
      throw new Error(`Puriva workflow brief foundation attach failed with HTTP ${patchResponse.status}.`);
    }
    if (!workflowBriefFoundationMatches(patchResponse.body?.data?.structuredInputJson)) {
      throw new Error("Puriva workflow brief foundation attach did not persist structured input.");
    }
    briefDetail = patchResponse.body.data ?? briefDetail;
    result.created.foundationAttached = true;
    note("attached workflow brief foundation", `${PURIVA_SERVICE_TAXONOMY_VERSION} + ${PURIVA_MARKET_INTELLIGENCE_VERSION}`);
  }

  result.foundation = {
    taxonomyVersion: PURIVA_SERVICE_TAXONOMY_VERSION,
    marketIntelligenceVersion: PURIVA_MARKET_INTELLIGENCE_VERSION,
    attached: true,
    serviceCategoryCount: expectedStructuredInput.serviceCategories.length
  };
  result.workflowBrief = briefDetail;

  const membersResponse = await request("/tenants/current/members", { token });
  const members = membersResponse.body?.data?.members ?? [];
  const portalMember = members.find(
    (entry) =>
      typeof entry.user?.email === "string" &&
      entry.user.email.trim().toLowerCase() === PURIVA_CLIENT_PORTAL_USER_EMAIL
  );

  if (!portalMember?.user?.id) {
    result.skipped.push("client access mapping — portal user not found in tenant");
    note("skipped client access", `${PURIVA_CLIENT_PORTAL_USER_EMAIL} not in tenant`);
  } else {
    const accessListResponse = await request(`/clients/${client.id}/users`, { token });
    const accessUsers = accessListResponse.body?.data?.users ?? [];
    const existingAccess = accessUsers.find((entry) => entry.user?.id === portalMember.user.id);

    if (existingAccess) {
      result.clientAccess = existingAccess;
      note("reused client access", portalMember.user.id);
    } else {
      const grantResponse = await request(`/clients/${client.id}/users`, {
        method: "POST",
        token,
        body: { userId: portalMember.user.id }
      });
      if (grantResponse.status !== 201 || grantResponse.body?.ok !== true) {
        throw new Error(`Puriva client access grant failed with HTTP ${grantResponse.status}.`);
      }
      result.clientAccess = grantResponse.body.data?.access ?? null;
      result.created.clientAccess = true;
      note("granted client access", portalMember.user.id);
    }
  }

  const handoffStatus = await request(`/workflow-briefs/${workflowBrief.id}/publication-handoff`, { token });
  if (handoffStatus.status !== 200 || handoffStatus.body?.ok !== true) {
    throw new Error(`Puriva publication handoff status failed with HTTP ${handoffStatus.status}.`);
  }

  result.publicationHandoff = {
    executionMode: handoffStatus.body.data?.executionMode ?? null,
    publicationTargetAvailable: handoffStatus.body.data?.publicationTargetAvailable === true,
    canExecuteHandoff: handoffStatus.body.data?.canExecuteHandoff === true
  };

  note(
    "publication handoff readiness",
    `target=${result.publicationHandoff.publicationTargetAvailable} execute=${result.publicationHandoff.canExecuteHandoff}`
  );

  return result;
}
