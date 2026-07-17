import type { ReactNode } from "react";
import { Button } from "./Button";
import { PageHeader } from "./PageHeader";

export type WorkflowPageShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  onClose: () => void;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
};

/**
 * Full-page host for multi-step workflow surfaces that previously used Modal.
 * Not a dialog — preserves Botanical page chrome and safe return navigation.
 */
export function WorkflowPageShell({
  title,
  description,
  eyebrow = "AI Delivery",
  onClose,
  backLabel = "Back to AI Delivery",
  children,
  footer,
  actions,
  titleId = "workflow-page-title"
}: WorkflowPageShellProps) {
  return (
    <section className="workflow-page" aria-labelledby={titleId}>
      <PageHeader
        actions={
          <div className="workflow-page-header-actions">
            {actions}
            <Button onClick={onClose} type="button" variant="tertiary">
              {backLabel}
            </Button>
          </div>
        }
        description={description}
        eyebrow={eyebrow}
        title={title}
        titleId={titleId}
      />
      <div className="workflow-page-body">{children}</div>
      {footer ? <div className="workflow-page-footer modal-footer ai-delivery-modal-footer">{footer}</div> : null}
    </section>
  );
}
