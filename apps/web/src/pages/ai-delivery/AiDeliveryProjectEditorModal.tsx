import React, { FormEvent } from "react";
import { Modal } from "../../components/ui";
import type { ClientSummary } from "../clients/ClientsPage";
import type {
  AiDeliveryProjectFormValues,
  AiDeliveryProjectSummary,
} from "./AiDeliveryPage";
import "./ai-delivery-modals.css";

export type AiDeliveryProjectEditorLinkOption = {
  id: string;
  name: string;
};

export type AiDeliveryProjectEditorModalProps = {
  isOpen: boolean;
  isEdit: boolean;
  draft: AiDeliveryProjectFormValues;
  clients: ClientSummary[];
  linkableProjects: AiDeliveryProjectEditorLinkOption[];
  selectedProject: AiDeliveryProjectSummary | null;
  saving: boolean;
  formatEnumLabel: (value?: string | null) => string;
  onClose: () => void;
  onDraftChange: (next: AiDeliveryProjectFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/**
 * Create / edit AI Delivery project modal.
 * Titles preserved for smoke compatibility: "Add AI Delivery" / "Edit AI Delivery".
 */
export function AiDeliveryProjectEditorModal({
  isOpen,
  isEdit,
  draft,
  clients,
  linkableProjects,
  selectedProject,
  saving,
  formatEnumLabel,
  onClose,
  onDraftChange,
  onSubmit,
}: AiDeliveryProjectEditorModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit AI Delivery" : "Add AI Delivery"}>
      <form className="entity-form ai-delivery-modal-panel" onSubmit={onSubmit}>
        <div className="field-grid">
          <label>
            Client - Required
            <select
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  clientId: event.target.value,
                  projectId: null,
                })
              }
              required
              value={draft.clientId}
            >
              <option value="">No client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Target month - Required
            <input
              aria-describedby="ai-delivery-target-month-help"
              type="month"
              onChange={(event) => onDraftChange({ ...draft, targetMonth: event.target.value })}
              required
              value={draft.targetMonth}
            />
          </label>

          <label>
            Project name - Required
            <input
              maxLength={255}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              placeholder="AI SEO & Content - June 2026"
              required
              value={draft.name}
            />
          </label>

          <div>
            <span>Project status</span>
            <strong>{selectedProject?.isArchived ? "Archived" : "Active / new"}</strong>
          </div>

          <div>
            <span>Brief status</span>
            <strong>{formatEnumLabel(selectedProject?.brief?.status ?? null)}</strong>
          </div>

          <label className="field-span-2">
            Scope / summary / notes - Optional
            <textarea
              maxLength={4000}
              onChange={(event) =>
                onDraftChange({ ...draft, plannedContentScopeNotes: event.target.value })
              }
              placeholder="Notes for admin team only"
              rows={4}
              value={draft.plannedContentScopeNotes}
            />
            <span className="muted-text">Admin-only scope or planning notes.</span>
          </label>

          <label>
            Linked internal project - Optional
            <select
              onChange={(event) =>
                onDraftChange({ ...draft, projectId: event.target.value || null })
              }
              value={draft.projectId ?? ""}
            >
              <option value="">No internal project link</option>
              {linkableProjects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-footer ai-delivery-modal-footer">
          <button className="ghost-action" disabled={saving} onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary-action" disabled={saving} type="submit">
            {saving ? "Saving" : isEdit ? "Update AI Delivery" : "Create AI Delivery"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
