export type FirstRunCompanyProfileState = {
  companyProfile: { id: string; name: string } | null;
} | null;

export type FirstRunClientState = {
  clients: Array<{ id: string; isArchived: boolean }>;
} | null;

export type FirstRunSetupState = {
  needsCompanyProfile: boolean;
  needsFirstClient: boolean;
  setupIncomplete: boolean;
};

export function deriveFirstRunSetupState(
  companyProfile: FirstRunCompanyProfileState,
  clients: FirstRunClientState,
  canManageCore: boolean
): FirstRunSetupState {
  if (!canManageCore) {
    return {
      needsCompanyProfile: false,
      needsFirstClient: false,
      setupIncomplete: false
    };
  }

  const needsCompanyProfile = !companyProfile?.companyProfile;
  const activeClients = (clients?.clients ?? []).filter((client) => !client.isArchived);
  const needsFirstClient = activeClients.length === 0;

  return {
    needsCompanyProfile,
    needsFirstClient,
    setupIncomplete: needsCompanyProfile || needsFirstClient
  };
}
