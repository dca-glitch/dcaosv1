import type { ReactNode } from "react";

type SectionPanelTone = "default" | "compact" | "highlight";

type SectionPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: SectionPanelTone;
};

export function SectionPanel({ title, description, action, children, className, tone = "default" }: SectionPanelProps) {
  const classes = [
    "section-panel",
    tone !== "default" ? `section-panel-${tone}` : null,
    className
  ].filter(Boolean).join(" ");

  return (
    <section className={classes}>
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
