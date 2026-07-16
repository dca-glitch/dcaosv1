import React, { FormEvent } from "react";
import { Button, Input, Modal, Select, Textarea } from "../../components/ui";
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
          <Select
            fullWidth
            label="Client - Required"
            onChange={(event) =>
              onDraftChange({
                ...draft,
                clientId: event.target.value,
                projectId: null,
              })
            }
            options={[
              { value: "", label: "No client" },
              ...clients.map((client) => ({
                value: client.id,
                label: client.name,
              })),
            ]}
            required
            value={draft.clientId}
          />

          <Input
            fullWidth
            aria-describedby="ai-delivery-target-month-help"
            label="Target month - Required"
            onChange={(event) => onDraftChange({ ...draft, targetMonth: event.target.value })}
            required
            type="month"
            value={draft.targetMonth}
          />

          <Input
            fullWidth
            label="Project name - Required"
            maxLength={255}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            placeholder="AI SEO & Content - June 2026"
            required
            value={draft.name}
          />

          <div>
            <span>Project status</span>
            <strong>{selectedProject?.isArchived ? "Archived" : "Active / new"}</strong>
          </div>

          <div>
            <span>Brief status</span>
            <strong>{formatEnumLabel(selectedProject?.brief?.status ?? null)}</strong>
          </div>

          <Textarea
            className="field-span-2"
            fullWidth
            helperText="Admin-only scope or planning notes."
            label="Scope / summary / notes - Optional"
            maxLength={4000}
            onChange={(event) =>
              onDraftChange({ ...draft, plannedContentScopeNotes: event.target.value })
            }
            placeholder="Notes for admin team only"
            rows={4}
            value={draft.plannedContentScopeNotes}
          />

          <Select
            fullWidth
            label="Linked internal project - Optional"
            onChange={(event) =>
              onDraftChange({ ...draft, projectId: event.target.value || null })
            }
            options={[
              { value: "", label: "No internal project link" },
              ...linkableProjects.map((proj) => ({
                value: proj.id,
                label: proj.name,
              })),
            ]}
            value={draft.projectId ?? ""}
          />
        </div>
        <div className="modal-footer ai-delivery-modal-footer">
          <Button disabled={saving} onClick={onClose} type="button" variant="tertiary">
            Cancel
          </Button>
          <Button disabled={saving} type="submit" variant="primary">
            {saving ? "Saving" : isEdit ? "Update AI Delivery" : "Create AI Delivery"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
