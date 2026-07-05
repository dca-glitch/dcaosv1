import React from "react";
import { Modal } from "../../components/Modal";

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
      title="Confirm WordPress publish"
      onClose={onCancel}
      footer={
        <>
          <button className="secondary-action" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="primary-action"
            disabled={!acknowledged || publishInProgress}
            onClick={() => void onConfirm()}
            type="button"
          >
            Publish to WordPress
          </button>
        </>
      }
    >
      <p>
        You are about to publish <strong>{deliverableTitle}</strong> to{" "}
        <strong>{publicationTargetLabel ?? "the selected target"}</strong> (
        {publicationTargetSiteUrl ?? "site URL not set"}).
      </p>
      <p className="muted-text">
        Live WordPress publish is deferred by default. The attempt writes a WordPress post only when credentials and <code>WORDPRESS_PUBLISH_ENABLED</code> are explicitly configured in a separately approved block. Otherwise the attempt is logged as provider-disabled and no external publish occurs.
      </p>
      <p className="muted-text">
        The prepared draft remains an internal scaffold until compliance review and admin review pass. Client delivery happens only through final archive or approved monthly report outputs.
      </p>
      <label style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <input
          checked={acknowledged}
          onChange={(event) => onAcknowledgedChange(event.target.checked)}
          type="checkbox"
        />
        I confirm this is a draft-only handoff attempt; live publish is deferred unless explicitly enabled.
      </label>
    </Modal>
  );
}
