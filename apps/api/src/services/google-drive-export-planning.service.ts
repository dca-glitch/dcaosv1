import { getGoogleDriveConfig, getGoogleDriveEnvPresence } from "./google-drive.service";

export interface GoogleDriveExportPlanningSnapshot {
  exportEnabledFlag: boolean;
  liveExportConfigured: boolean;
  envPresence: Record<string, boolean>;
}

export function getGoogleDriveExportPlanningSnapshot(): GoogleDriveExportPlanningSnapshot {
  const envPresence = getGoogleDriveEnvPresence();
  const exportEnabledFlag = envPresence.GOOGLE_DRIVE_EXPORT_ENABLED === true;
  const liveExportConfigured = getGoogleDriveConfig() !== null;

  return {
    exportEnabledFlag,
    liveExportConfigured,
    envPresence
  };
}
