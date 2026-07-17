import React from "react";
import { Button, Checkbox, Modal } from "../../components/ui";

export type AiDeliveryWordPressPublishConfirmModalProps = {
  deliverableTitle: string;
  publicationTargetLabel: string | null | undefined;
  publicationTargetSiteUrl: string | null | undefined;
  acknowledged: boolean;
  publishInProgress: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onAcknowledgedChange: (acknowledged: boolean) => void;
};

export function AiDeliveryWordPressPublishConfirmModal({
  deliverableTitle,
  publicationTargetLabel,
  publicationTargetSiteUrl,
  acknowledged,
  publishInProgress,
  onCancel,
  onConfirm,
  onAcknowledgedChange
}: AiDeliveryWordPressPublishConfirmModalProps) {
  return (
    <Modal
      isOpen
      title="Publish to WordPress"
      onClose={onCancel}
      footer={
        <div className="ai-delivery-modal-actions">
          <Button onClick={onCancel} type="button" variant="tertiary">
            Cancel
          </Button>
          <Button
            disabled={!acknowledged || publishInProgress}
            onClick={() => void onConfirm()}
            type="button"
            variant="primary"
          >
            Publish to WordPress
          </Button>
        </div>
      }
    >
      <p>
        You are about to publish <strong>{deliverableTitle}</strong> to{" "}
        <strong>{publicationTargetLabel ?? "the selected target"}</strong> (
        {publicationTargetSiteUrl ?? "site URL not set"}).
      </p>
      <p className="muted-text">
        Live WordPress publish is deferred by default. The attempt writes a WordPress post only when credentials and publishing are explicitly enabled in a separately approved block. Otherwise the attempt is logged and no external publish occurs.
      </p>
      <p className="muted-text">
        The prepared draft remains an internal scaffold until compliance review and admin review pass. Client delivery happens only through final archive or approved monthly report outputs.
      </p>
      <Checkbox
        checked={acknowledged}
        className="mt-4"
        label="I acknowledge this is a draft-only handoff attempt; live publish is deferred unless explicitly enabled."
        onChange={(event) => onAcknowledgedChange(event.target.checked)}
      />
    </Modal>
  );
}
