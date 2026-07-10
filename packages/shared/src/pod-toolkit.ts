export const POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION = "POD_TOOLKIT_WORKFLOW_CONTRACT_V1";

export type PodToolkitWorkflowStage =
  | "intake"
  | "bounded_research"
  | "angle_planning"
  | "draft_review"
  | "approved_handoff"
  | "archived";

export type PodToolkitResearchSourceOrigin =
  | "operator_note"
  | "approved_url_reference"
  | "uploaded_document"
  | "existing_internal_record";

export interface PodToolkitNoLiveMarketplacePolicy {
  marketplaceLiveLookupAllowed: false;
  broadCrawlingAllowed: false;
  livePublishAllowed: false;
  supplierCredentialAccessAllowed: false;
}

export interface PodToolkitResearchSourceReference {
  id: string;
  origin: PodToolkitResearchSourceOrigin;
  title: string;
  sourceUrl: string | null;
  notes: string | null;
}

export interface PodToolkitWorkflowContractV1 {
  version: typeof POD_TOOLKIT_WORKFLOW_CONTRACT_VERSION;
  projectId: string;
  tenantId: string;
  clientId: string | null;
  brandName: string;
  targetMonth: string | null;
  stage: PodToolkitWorkflowStage;
  researchSources: PodToolkitResearchSourceReference[];
  productAngles: string[];
  listingDrafts: string[];
  imageBriefs: string[];
  policy: PodToolkitNoLiveMarketplacePolicy;
  operatorReviewRequired: true;
}
