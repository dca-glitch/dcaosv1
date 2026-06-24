import { type FormEvent, useState } from "react";
import { Modal } from "../../components/Modal";
import { ModalActions } from "../../components/ui/ModalActions";

export type WordPressConfig = {
  siteUrl: string;
  siteSlug?: string | null;
  wordPressComSite: boolean;
};

type WordPressPanelProps = {
  config: WordPressConfig | null;
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  onSave: (values: WordPressConfig) => Promise<boolean>;
};

export function WordPressConfigPanel({ config, canEdit, loading, error, onSave }: WordPressPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<WordPressConfig>({
    siteUrl: config?.siteUrl ?? "",
    siteSlug: config?.siteSlug ?? "",
    wordPressComSite: config?.wordPressComSite ?? false
  });

  function closeEditor() {
    setIsEditing(false);
  }

  function openEditor() {
    setDraft({
      siteUrl: config?.siteUrl ?? "",
      siteSlug: config?.siteSlug ?? "",
      wordPressComSite: config?.wordPressComSite ?? false
    });
    setIsEditing(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(draft);
      if (ok) {
        closeEditor();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <article className="entity-card entity-card-wide">
        <div className="entity-card-header">
          <div>
            <h2>WordPress Site Config</h2>
          </div>
          {canEdit ? (
            <button className="secondary-action" onClick={openEditor} type="button">
              {config ? "Edit" : "Configure"}
            </button>
          ) : null}
        </div>
        <div className="entity-field-grid">
          <div>
            <span>Site URL</span>
            <strong>{config?.siteUrl || "Not configured"}</strong>
          </div>
          <div>
            <span>Site slug</span>
            <strong>{config?.siteSlug || "Not set"}</strong>
          </div>
          <div>
            <span>WordPress.com site</span>
            <strong>{config ? (config.wordPressComSite ? "Yes" : "No") : "Not configured"}</strong>
          </div>
          <div className="entity-span-2">
            <span>Status</span>
            <strong>
              <em>Non-secret site config only. No credentials are stored. No WordPress connection is verified. Publishing remains disabled/mock until a future approved integration block.</em>
            </strong>
          </div>
        </div>
      </article>

      {isEditing ? (
        <Modal onClose={closeEditor} title={config ? "Edit WordPress Config" : "Configure WordPress Site"}>
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Non-secret WordPress site configuration only. No credentials or tokens are accepted.</p>
            <ModalActions disabled={saving} label={config ? "Update config" : "Configure"} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <label>
                Site URL - Required
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, siteUrl: event.target.value }))}
                  placeholder="https://example.com"
                  required
                  type="url"
                  value={draft.siteUrl}
                />
                <span className="muted-text">HTTPS URL of your WordPress site</span>
              </label>
              <label>
                Site slug - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, siteSlug: event.target.value }))}
                  placeholder="example or example.wordpress.com"
                  value={draft.siteSlug ?? ""}
                />
                <span className="muted-text">Site identifier or domain slug</span>
              </label>
              <label>
                <input
                  checked={draft.wordPressComSite}
                  onChange={(event) => setDraft((current) => ({ ...current, wordPressComSite: event.target.checked }))}
                  type="checkbox"
                />
                This is a WordPress.com site
                <span className="muted-text">Check if using WordPress.com hosting instead of self-hosted</span>
              </label>
            </div>
            <ModalActions disabled={saving} label={config ? "Update config" : "Configure"} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </>
  );
}
