import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  titleId?: string;
};

export function PageHeader({ eyebrow, title, description, actions, meta, titleId }: PageHeaderProps) {
  return (
    <div className="page-header section-header">
      <div className="page-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
        {meta ? <div className="page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="toolbar action-bar">{actions}</div> : null}
    </div>
  );
}