import React from "react";
import { Button, Textarea, WorkflowPageShell } from "../../components/ui";
import {
  AiDeliveryInlineAlert,
  AiDeliveryInlineEmpty,
  AiDeliveryInlineLoading,
} from "./ai-delivery-shared-ui";
import "./ai-delivery-modals.css";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

export type AiDeliveryBriefDetail = {
  id: string;
  status: string;
  clientPriorities: string | null;
  productsServicesFocus: string | null;
  targetAudience: string | null;
  marketsCompetitors: string | null;
  notes: string | null;
  revisionCount: number;
  submittedAt: string | null;
  revisionRequestedAt: string | null;
  revisedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryBriefModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  error: string | null;
  brief: AiDeliveryBriefDetail | null;
  onBriefChange: (next: AiDeliveryBriefDetail) => void;
  canEdit: boolean;
  canSave: boolean;
  formatEnumLabel: (value?: string | null) => string;
  onSave: (projectId: string) => void;
};

/**
 * P4E Brief Form/View — workflow page (was modal). Heading "AI Delivery Brief".
 * Apply-to-brief from Research remains in AiDeliveryPage / Research lane.
 * Archive/restore are not part of the current Brief contract.
 */
export function AiDeliveryBriefModal({
  isOpen,
  onClose,
  project,
  loading,
  error,
  brief,
  onBriefChange,
  canEdit,
  canSave,
  formatEnumLabel,
  onSave,
}: AiDeliveryBriefModalProps) {
  if (!isOpen) {
    return null;
  }

  const editable = canEdit && canSave;

  return (
    <WorkflowPageShell onClose={onClose} title="AI Delivery Brief" titleId="ai-delivery-brief-title">
      {loading ? (
        <AiDeliveryInlineLoading label="Loading brief" />
      ) : project ? (
        brief ? (
          <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-brief-panel stack gap-md">
            {error ? <AiDeliveryInlineAlert message={error} title="Brief action blocked" /> : null}
            <dl className="brief-grid">
              <div>
                <dt>Client</dt>
                <dd>{project.client?.name ?? "No client"}</dd>
              </div>
              <div>
                <dt>AI Delivery project</dt>
                <dd>{project.name}</dd>
              </div>
              <div>
                <dt>Brief status</dt>
                <dd>{formatEnumLabel(brief.status)}</dd>
              </div>
              <div>
                <dt>Revisions</dt>
                <dd>{brief.revisionCount ?? 0}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(brief.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(brief.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>

            <section className="field-panel ai-delivery-section-compact">
              {editable ? (
                <Textarea
                  fullWidth
                  id="ai-brief-client-priorities"
                  label="Client input / priorities - Optional"
                  onChange={(e) => onBriefChange({ ...brief, clientPriorities: e.target.value })}
                  placeholder="Client priorities, requested topics, or campaign focus"
                  rows={3}
                  value={brief.clientPriorities ?? ""}
                />
              ) : (
                <>
                  <h3>Client input / priorities - Optional</h3>
                  <pre className="pre-wrap-block">{brief.clientPriorities ?? "Not set"}</pre>
                </>
              )}
            </section>

            <section className="field-panel ai-delivery-section-compact">
              {editable ? (
                <Textarea
                  fullWidth
                  id="ai-brief-products-services"
                  label="Products / services focus - Optional"
                  onChange={(e) => onBriefChange({ ...brief, productsServicesFocus: e.target.value })}
                  placeholder="Products, services, or offers to emphasize"
                  rows={3}
                  value={brief.productsServicesFocus ?? ""}
                />
              ) : (
                <>
                  <h3>Products / services focus - Optional</h3>
                  <pre className="pre-wrap-block">{brief.productsServicesFocus ?? "Not set"}</pre>
                </>
              )}
            </section>

            <section className="field-panel ai-delivery-section-compact">
              {editable ? (
                <Textarea
                  fullWidth
                  id="ai-brief-target-audience"
                  label="Target audience - Optional"
                  onChange={(e) => onBriefChange({ ...brief, targetAudience: e.target.value })}
                  placeholder="Audience segments, buyer roles, or reader context"
                  rows={3}
                  value={brief.targetAudience ?? ""}
                />
              ) : (
                <>
                  <h3>Target audience - Optional</h3>
                  <pre className="pre-wrap-block">{brief.targetAudience ?? "Not set"}</pre>
                </>
              )}
            </section>

            <section className="field-panel ai-delivery-section-compact">
              {editable ? (
                <Textarea
                  fullWidth
                  id="ai-brief-research-feedback"
                  label="Research / admin feedback - Optional"
                  onChange={(e) => onBriefChange({ ...brief, marketsCompetitors: e.target.value })}
                  placeholder="Markets, competitors, research findings, or admin feedback"
                  rows={3}
                  value={brief.marketsCompetitors ?? ""}
                />
              ) : (
                <>
                  <h3>Research / admin feedback - Optional</h3>
                  <pre className="pre-wrap-block">{brief.marketsCompetitors ?? "Not set"}</pre>
                </>
              )}
            </section>

            <section className="field-panel ai-delivery-section-compact">
              {editable ? (
                <Textarea
                  fullWidth
                  helperText="Admin-only."
                  id="ai-brief-internal-notes"
                  label="Optional internal notes"
                  onChange={(e) => onBriefChange({ ...brief, notes: e.target.value })}
                  placeholder="Notes for admin team only"
                  rows={6}
                  value={brief.notes ?? ""}
                />
              ) : (
                <>
                  <h3>Optional internal notes</h3>
                  <pre className="pre-wrap-block">{brief.notes ?? "Not set"}</pre>
                </>
              )}
            </section>

            <div className="modal-footer ai-delivery-modal-footer">
              <Button onClick={onClose} type="button" variant="tertiary">
                Close
              </Button>
              {editable ? (
                <Button onClick={() => onSave(project.id)} type="button" variant="primary">
                  Save brief
                </Button>
              ) : null}
            </div>
          </div>
        ) : project.brief ? (
          <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-brief-panel stack gap-md">
            {error ? <AiDeliveryInlineAlert message={error} title="Brief action blocked" /> : null}
            <dl className="brief-grid">
              <div>
                <dt>Status</dt>
                <dd>{project.brief.status}</dd>
              </div>
              <div>
                <dt>Revisions</dt>
                <dd>{project.brief.revisionCount ?? 0}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(project.brief.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(project.brief.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
            <section className="field-panel">
              <h3>Planned content scope notes</h3>
              <pre className="pre-wrap-block">{project.plannedContentScopeNotes ?? "Not set"}</pre>
            </section>
            <div className="modal-footer ai-delivery-modal-footer">
              <Button onClick={onClose} type="button" variant="tertiary">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <AiDeliveryInlineEmpty>
            No brief is available for this project yet. Create or open the project record to start briefing.
          </AiDeliveryInlineEmpty>
        )
      ) : (
        <div>Project not found.</div>
      )}
    </WorkflowPageShell>
  );
}
