import { StatusBadge } from "../../components/ui";
import {
  SETTINGS_AREA_CATALOG,
  settingsAreaBadgeStatus,
  type SettingsAreaItem
} from "./settings-display";
import "./settings.css";

type SettingsDeferredAreasPanelProps = {
  catalog?: SettingsAreaItem[];
  /** When true, only deferred rows are listed (available surfaces already have pages). */
  deferredOnly?: boolean;
};

export function SettingsDeferredAreasPanel({
  catalog = SETTINGS_AREA_CATALOG,
  deferredOnly = true
}: SettingsDeferredAreasPanelProps) {
  const rows = deferredOnly ? catalog.filter((item) => item.availability === "deferred") : catalog;

  return (
    <div className="settings-area-list" aria-label="Settings areas not available in this MVP">
      {rows.map((item) => (
        <div className="settings-area-row" key={item.key}>
          <div className="settings-area-copy">
            <strong>{item.label}</strong>
            <span className="muted-text">{item.note}</span>
          </div>
          <div className="settings-area-meta">
            <StatusBadge status={settingsAreaBadgeStatus(item.availability)} />
            {item.href && item.availability === "deferred" ? (
              <a className="secondary-action" href={item.href}>
                Open related view
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
