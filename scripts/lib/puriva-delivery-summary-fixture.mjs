/**
 * Shared Puriva MVP delivery-summary fixture for client portal smokes.
 * Seeds MI handoff, Google Docs export deliverable, and WordPress publish log.
 */

export async function seedPurivaDeliverySummaryFixture({
  request,
  requireOkData,
  record,
  makeSmokeId,
  adminToken,
  client,
  aiProject,
  labelPrefix = "[SMOKE][CLIENT_PORTAL]"
}) {
  const miProject = requireOkData(
    "puriva delivery seed mi project",
    await request("/market-intelligence-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        title: `${labelPrefix} ${makeSmokeId("mi")}`,
        description: "Puriva delivery summary smoke fixture",
        keywords: "skincare, clinic, puriva",
        competitors: "Example Competitor",
        niche: "Beauty clinic",
        productServiceFocus: "Client-safe MI summary",
        targetClientName: client.name,
        targetMonth: aiProject.targetMonth ?? "2026-07",
        status: "ACTIVE"
      }
    })
  ).project;

  for (const source of [
    { title: "Smoke Competitor Site", sourceType: "WEBSITE", sourceUrl: "https://competitor.example.com", sourceNotes: "Positioning" },
    { title: "Smoke Industry Note", sourceType: "OTHER", sourceUrl: "https://reports.example.com/trend", sourceNotes: "Trend" }
  ]) {
    requireOkData(
      `puriva delivery seed mi source ${source.title}`,
      await request(`/market-intelligence-projects/${miProject.id}/sources`, {
        method: "POST",
        token: adminToken,
        body: source
      })
    );
  }

  const researchRun = requireOkData(
    "puriva delivery seed mi research run",
    await request(`/market-intelligence-projects/${miProject.id}/research-runs`, {
      method: "POST",
      token: adminToken,
      body: { status: "PENDING" }
    })
  ).researchRun;

  const executedRun = requireOkData(
    "puriva delivery execute mi research run",
    await request(`/market-intelligence-projects/${miProject.id}/research-runs/${researchRun.id}/execute`, {
      method: "POST",
      token: adminToken,
      body: {}
    }),
    200
  ).researchRun;
  record("puriva delivery mi research run executed", executedRun.status === "EXECUTED", executedRun.status ?? "missing");

  const insightsResponse = await request(`/market-intelligence-projects/${miProject.id}/insights`, { token: adminToken });
  const generatedInsight = (insightsResponse.body?.data?.insights ?? []).find(
    (insight) => typeof insight.title === "string" && insight.title.startsWith("Generated Insight")
  );
  if (!generatedInsight?.id) {
    throw new Error("Puriva delivery seed could not find generated MI insight.");
  }

  requireOkData(
    "puriva delivery approve mi insight",
    await request(`/market-intelligence-projects/${miProject.id}/insights/${generatedInsight.id}`, {
      method: "PUT",
      token: adminToken,
      body: { status: "APPROVED", reviewerNotes: "Approved for client portal delivery summary smoke." }
    }),
    200
  );

  const preparedHandoff = requireOkData(
    "puriva delivery prepare mi handoff",
    await request(`/market-intelligence-projects/${miProject.id}/handoffs/prepare`, {
      method: "POST",
      token: adminToken,
      body: { insightId: generatedInsight.id }
    })
  ).handoff;

  const readyHandoff = requireOkData(
    "puriva delivery mark mi handoff ready",
    await request(`/market-intelligence-projects/${miProject.id}/handoffs/${preparedHandoff.id}/status`, {
      method: "PUT",
      token: adminToken,
      body: { handoffStatus: "READY" }
    }),
    200
  ).handoff;

  requireOkData(
    "puriva delivery apply mi handoff to ai project",
    await request(`/ai-delivery/projects/${aiProject.id}/market-intelligence-context/apply`, {
      method: "POST",
      token: adminToken,
      body: { handoffId: readyHandoff.id }
    }),
    200
  );

  const contentDraft = requireOkData(
    "puriva delivery seed content draft",
    await request(`/ai-delivery-projects/${aiProject.id}/content-drafts`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `${labelPrefix} Draft ${makeSmokeId("draft")}`,
        draftBody: "Client-safe delivery summary smoke fixture.",
        status: "DRAFT"
      }
    })
  ).contentDraft;

  const articleImage = requireOkData(
    "puriva delivery seed approved article image",
    await request(`/ai-delivery-projects/${aiProject.id}/article-images`, {
      method: "POST",
      token: adminToken,
      body: {
        contentDraftId: contentDraft.id,
        title: `${labelPrefix} Image ${makeSmokeId("img")}`,
        prompt: "Smoke fixture image prompt.",
        status: "APPROVED"
      }
    })
  ).articleImage;

  const googleExportUrl = "https://docs.google.com/document/d/smoke-client-portal-export";

  requireOkData(
    "puriva delivery create DELIVERED deliverable with export",
    await request(`/ai-delivery-projects/${aiProject.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `${labelPrefix} Google Doc ${makeSmokeId("doc")}`,
        deliveryType: "CONTENT_PACKAGE",
        status: "DELIVERED",
        articleImageId: articleImage.id,
        exportUrl: googleExportUrl
      }
    })
  );

  const target = requireOkData(
    "puriva delivery create publication target",
    await request(`/clients/${client.id}/publication-targets`, {
      method: "POST",
      token: adminToken,
      body: {
        label: "Smoke publish target",
        siteUrl: "https://smoke-puriva.example.com",
        siteSlug: "smoke-puriva",
        isPrimary: true
      }
    })
  ).publicationTarget;

  const publishDeliverable = requireOkData(
    "puriva delivery create publish deliverable",
    await request(`/ai-delivery-projects/${aiProject.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `${labelPrefix} Publish package ${makeSmokeId("pub")}`,
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT",
        description: "Smoke WordPress publish body for Puriva delivery summary proof."
      }
    })
  ).deliverable;

  const publishResponse = await request(
    `/ai-delivery-projects/${aiProject.id}/deliverables/${publishDeliverable.id}/publish-wordpress`,
    {
      method: "POST",
      token: adminToken,
      body: { publicationTargetId: target.id }
    }
  );
  record(
    "puriva delivery publish-wordpress attempted",
    publishResponse.status === 200 && publishResponse.body?.ok === true,
    `${publishResponse.status}`
  );

  const deliverySummaryResponse = await request(
    `/client-portal/projects/${aiProject.id}/delivery-summary`,
    { token: adminToken }
  );
  const summary = deliverySummaryResponse.body?.data?.deliverySummary ?? null;

  return {
    marketSummary: summary?.marketIntelligence?.marketSummary ?? null,
    recommendedActionCount: summary?.marketIntelligence?.recommendedActions?.length ?? 0,
    googleExportUrl,
    publishingStatus: summary?.websitePublishing?.status ?? null
  };
}
