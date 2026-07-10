import type { CSSProperties, ReactNode } from "react";
import { panelCSS } from "../../design-system/panel";

type SectionPanelTone = "default" | "compact" | "highlight";

type SectionPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: SectionPanelTone;
  /** Optional accent hex/CSS color for panelCSS tint. */
  tint?: string;
};

export function SectionPanel({
  title,
  description,
  action,
  children,
  className,
  tone = "default",
  tint,
}: SectionPanelProps) {
  const classes = [
    "section-panel",
    tone !== "default" ? `section-panel-${tone}` : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    ...panelCSS(tint, true),
    borderRadius: "var(--ds-radius-lg)",
  };

  return (
    <section className={classes} style={style}>
      <header className="section-panel-header section-panel-header-polished">
        <div className="section-panel-heading">
          <h2>{title}</h2>
          {description ? <p className="section-panel-description">{description}</p> : null}
        </div>
        {action ? <div className="section-panel-action">{action}</div> : null}
      </header>
      <div className="section-panel-body">{children}</div>
    </section>
  );
}
