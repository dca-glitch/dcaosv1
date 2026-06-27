export type ClientKind = "AGENCY_CLIENT" | "OWN_DOMAIN";
export type ClientMigrationStatus = "ACTIVE" | "PLANNED_LICENSEE_TENANT" | "MIGRATED";

export interface ClientOperatingSummary {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  clientKind: ClientKind;
  legalEntityName: string | null;
  accountGroupName: string | null;
  migrationStatus: ClientMigrationStatus;
  isArchived: boolean;
}

export interface PublicationTargetSummary {
  id: string;
  clientId: string;
  label: string;
  connectorType: string;
  siteUrl: string;
  siteSlug: string | null;
  wordPressComSite: boolean;
  isDefault: boolean;
  isArchived: boolean;
}
