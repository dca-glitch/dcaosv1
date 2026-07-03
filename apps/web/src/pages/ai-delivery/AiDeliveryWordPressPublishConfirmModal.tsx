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
        This writes a WordPress post when credentials and <code>WORDPRESS_PUBLISH_ENABLED</code> are configured. Otherwise the attempt is logged as provider-disabled.
      </p>
      <label style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <input
          checked={acknowledged}
          onChange={(event) => onAcknowledgedChange(event.target.checked)}
          type="checkbox"
        />
        I confirm publish to this client WordPress target.
      </label>
    </Modal>
  );
}
