import type { AuthTenantMembershipSummary } from "../auth/types";

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUserSummary {
  id: string;
  email: string;
  name: string | null;
  status: string;
}

export interface TenantMembershipCard {
  tenant: TenantSummary;
  tenantMembershipId: string;
  roles: string[];
}

export interface TenantListResponse {
  user: TenantUserSummary;
  currentTenant: TenantMembershipCard | null;
  availableTenants: TenantMembershipCard[];
}

export interface TenantCurrentResponse {
  user: TenantUserSummary;
  currentTenant: TenantMembershipCard;
  availableTenants: TenantMembershipCard[];
}

export interface TenantMemberSummary {
  tenantMembershipId: string;
  user: TenantUserSummary;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantMembersResponse {
  tenant: TenantSummary;
  currentMembership: AuthTenantMembershipSummary;
  members: TenantMemberSummary[];
}

export interface TenantMemberDetailResponse {
  tenant: TenantSummary;
  currentMembership: AuthTenantMembershipSummary;
  member: TenantMemberSummary;
}

export interface TenantSettingsResponse {
  tenant: TenantSummary;
  currentMembership: AuthTenantMembershipSummary;
}

export interface TenantSettingsUpdateRequest {
  name?: string;
}
