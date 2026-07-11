import { SETTINGS_SUB_NAV, type SettingsShellView } from "./settings-display";
import "./settings.css";

type SettingsSubNavProps = {
  activeView: SettingsShellView;
};

/** Presentational hash links between existing settings routes — does not change routing. */
export function SettingsSubNav({ activeView }: SettingsSubNavProps) {
  return (
    <nav className="settings-subnav" aria-label="Settings sections">
      {SETTINGS_SUB_NAV.map((item) => (
        <a
          key={item.view}
          aria-current={item.view === activeView ? "page" : undefined}
          className={`settings-subnav-link${item.view === activeView ? " is-active" : ""}`}
          href={item.href}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
