import { StatusBadge } from "../../components/ui";
import {
  SECONDARY_MODULE_CATALOG,
  moduleSurfaceBadgeStatus,
  type ModuleSurfaceItem
} from "./modules-display";
import "./modules.css";

type ModulesAvailabilityPanelProps = {
  catalog?: ModuleSurfaceItem[];
  /** When true, only paused/deferred Phase 12 surfaces are listed. */
  pausedOnly?: boolean;
};

export function ModulesAvailabilityPanel({
  catalog = SECONDARY_MODULE_CATALOG,
  pausedOnly = true
}: ModulesAvailabilityPanelProps) {
  const rows = pausedOnly ? catalog.filter((item) => item.availability === "paused") : catalog;

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="modules-availability-list" aria-label="Secondary modules not available in this MVP">
      {rows.map((item) => (
        <div className="modules-availability-row" key={item.key}>
          <div className="modules-availability-copy">
            <strong>{item.label}</strong>
            <span className="muted-text">{item.note}</span>
          </div>
          <div className="modules-availability-meta">
            <StatusBadge status={moduleSurfaceBadgeStatus(item.availability)} />
          </div>
        </div>
      ))}
    </div>
  );
}
