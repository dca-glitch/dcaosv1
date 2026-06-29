import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  meta?: ReactNode;
  titleId?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  actions,
  filters,
  meta,
  titleId
}: PageHeaderProps) {
  const headerAction = action ?? actions;

  return (
    <header className="page-header section-header ds-page-header">
      <div className="ds-page-header-top">
        <div className="page-header-copy">
          {eyebrow ? <span className="eyebrow ds-eyebrow">{eyebrow}</span> : null}
          <h1 id={titleId}>{title}</h1>
        </div>
        {headerAction ? <div className="page-header-action toolbar action-bar">{headerAction}</div> : null}
      </div>
      {description ? <p className="page-description ds-page-description">{description}</p> : null}
      {meta ? <div className="page-meta ds-page-meta">{meta}</div> : null}
      {filters ? <div className="page-filters ds-page-filters">{filters}</div> : null}
    </header>
  );
}
