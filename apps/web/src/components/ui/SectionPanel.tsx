import type { ReactNode } from "react";

type SectionPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionPanel({ title, description, action, children, className }: SectionPanelProps) {
  return (
    <section className={["section-panel", className].filter(Boolean).join(" ")}>
      <header className="section-panel-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="section-panel-action">{action}</div> : null}
      </header>
      <div className="section-panel-body">{children}</div>
    </section>
  );
}