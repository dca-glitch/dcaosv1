import React, { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  AiContextPreviewResponse,
  AiKnowledgeItemInputRequest,
  AiKnowledgeItemSummary
} from "@dca-os-v1/shared";
import { Alert, Button, Checkbox, Input, LoadingState, Modal, SectionPanel, Select, StatusBadge, Textarea } from "../../components/ui";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

type AiKnowledgeContextPanelProps = {
  project: AiDeliveryProjectSummary;
  onClose: () => void;
  onFetchKnowledgeItems: (projectId: string) => Promise<AiKnowledgeItemSummary[]>;
  onCreateKnowledgeItem: (input: AiKnowledgeItemInputRequest) => Promise<AiKnowledgeItemSummary | null>;
  onUpdateKnowledgeItem: (id: string, input: AiKnowledgeItemInputRequest) => Promise<AiKnowledgeItemSummary | null>;
  onPreviewContext: (input: {
    clientId: string;
    aiDeliveryProjectId: string;
    workflowType: string;
    includeRaw?: boolean;
    saveSnapshot?: boolean;
  }) => Promise<AiContextPreviewResponse | null>;
};

const knowledgeTypes = [
  "CLIENT_FACT",
  "BRAND_VOICE",
  "PROJECT_CONTEXT",
  "RESEARCH_NOTE",
  "CONTENT_EXAMPLE"
] as const;

function KnowledgeInlineLoading({ label }: { label: string }) {
  return <LoadingState label={label} variant="inline" />;
}

function KnowledgeInlineError({ message }: { message: string }) {
  return <Alert message={message} title="Blocked" variant="danger" />;
}

export function AiKnowledgeContextPanel({
  project,
  onClose,
  onFetchKnowledgeItems,
  onCreateKnowledgeItem,
  onUpdateKnowledgeItem,
  onPreviewContext
}: AiKnowledgeContextPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AiKnowledgeItemSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<AiContextPreviewResponse | null>(null);
  const [includeRaw, setIncludeRaw] = useState(false);
  const [saveSnapshot, setSaveSnapshot] = useState(false);
  const [workflowType, setWorkflowType] = useState("article_draft");
  const [form, setForm] = useState({
    title: "",
    type: "CLIENT_FACT" as AiKnowledgeItemInputRequest["type"],
    body: ""
  });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await onFetchKnowledgeItems(project.id);
      setItems(next);
    } catch {
      setError("Could not load knowledge items.");
    } finally {
      setLoading(false);
    }
  }, [onFetchKnowledgeItems, project.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await onCreateKnowledgeItem({
        clientId: project.clientId,
        aiDeliveryProjectId: project.id,
        scope: "PROJECT",
        type: form.type,
        status: "RAW",
        title: form.title.trim(),
        body: form.body.trim() || null,
        allowedForPrompt: false,
        clientVisible: false
      });
      if (created) {
        setForm({ title: "", type: "CLIENT_FACT", body: "" });
        await reload();
      }
    } catch {
      setError("Could not create knowledge item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(item: AiKnowledgeItemSummary) {
    setSaving(true);
    setError(null);
    try {
      await onUpdateKnowledgeItem(item.id, {
        scope: item.scope,
        type: item.type,
        title: item.title,
        status: "APPROVED",
        allowedForPrompt: true,
        clientVisible: false
      });
      await reload();
    } catch {
      setError("Could not update knowledge item.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const result = await onPreviewContext({
        clientId: project.clientId,
        aiDeliveryProjectId: project.id,
        workflowType,
        includeRaw,
        saveSnapshot
      });
      setPreview(result);
    } catch {
      setError("Context preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="AI Knowledge & Context Preview">
      <div className="ai-knowledge-context-panel stack gap-md">
        {error ? <KnowledgeInlineError message={error} /> : null}
        {loading ? <KnowledgeInlineLoading label="Loading knowledge items" /> : null}

        {!loading ? (
          <>
            <SectionPanel
              description="Approved + allowedForPrompt items included by default."
              title="Knowledge items"
              tone="compact"
            >
              <div className="ai-knowledge-context-summary" role="status">
                <strong>Context readiness:</strong>{" "}
                {items.some((item) => item.status === "APPROVED" && item.allowedForPrompt)
                  ? "Approved knowledge ready for prompt use."
                  : items.length > 0
                    ? "Knowledge items exist but none are approved for prompt use yet."
                    : "Knowledge context missing — create and approve items before AI workflow runs are grounded."}
              </div>
              {items.length === 0 ? (
                <p className="inline-empty muted-text">No items yet. Create RAW, then approve for prompt use.</p>
              ) : (
                <div
                  className="table-wrap table-scroll ai-knowledge-table-wrap"
                  role="region"
                  tabIndex={0}
                  aria-label="Knowledge items (scrollable)"
                >
                  <table className="data-table compact" aria-label="Knowledge items">
                    <thead>
                      <tr>
                        <th scope="col">Title</th>
                        <th scope="col">Type</th>
                        <th scope="col">Status</th>
                        <th scope="col">Prompt</th>
                        <th scope="col"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{item.type}</td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td>{item.allowedForPrompt ? "Yes" : "No"}</td>
                          <td>
                            {item.status !== "APPROVED" ? (
                              <button
                                className="ghost-action"
                                disabled={saving}
                                onClick={() => void handleApprove(item)}
                                type="button"
                              >
                                Approve
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionPanel>

            <SectionPanel description="Creates RAW item; approve to allow prompt use." title="Create knowledge item" tone="compact">
              <form className="stack gap-sm ai-knowledge-create-form" onSubmit={(event) => void handleCreate(event)}>
                <Input
                  fullWidth
                  label="Title"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  value={form.title}
                />
                <Select
                  fullWidth
                  label="Type"
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AiKnowledgeItemInputRequest["type"] }))}
                  options={knowledgeTypes.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  value={form.type}
                />
                <Textarea
                  fullWidth
                  label="Body"
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  rows={3}
                  value={form.body}
                />
                <Button disabled={saving || !form.title.trim()} type="submit" variant="primary">
                  Create RAW item
                </Button>
              </form>
            </SectionPanel>

            <SectionPanel description="Preview only — no content generation." title="Context preview" tone="compact">
              <div className="stack gap-sm ai-knowledge-preview-controls">
                <Select
                  fullWidth
                  label="Workflow type"
                  onChange={(event) => setWorkflowType(event.target.value)}
                  options={[
                    { value: "dry_run", label: "dry_run" },
                    { value: "article_draft", label: "article_draft" },
                    { value: "content_plan_draft", label: "content_plan_draft" },
                    { value: "summary", label: "summary" },
                  ]}
                  value={workflowType}
                />
                <Checkbox
                  checked={includeRaw}
                  label="Include raw/reviewed (preview warns)"
                  onChange={(event) => setIncludeRaw(event.target.checked)}
                />
                <Checkbox
                  checked={saveSnapshot}
                  label="Save snapshot"
                  onChange={(event) => setSaveSnapshot(event.target.checked)}
                />
                <Button disabled={previewLoading} onClick={() => void handlePreview()} type="button" variant="tertiary">
                  Preview AI context
                </Button>
              </div>

              {previewLoading ? <KnowledgeInlineLoading label="Building context preview" /> : null}
              {preview ? (
                <div className="stack gap-sm ai-knowledge-preview-block">
                  <dl className="ai-knowledge-preview-meta">
                    <div>
                      <dt>Can run</dt>
                      <dd>{preview.canRun ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt>Token estimate</dt>
                      <dd>{preview.tokenEstimate}</dd>
                    </div>
                    <div>
                      <dt>Selected sources</dt>
                      <dd>{preview.selectedSources.length}</dd>
                    </div>
                    {preview.snapshotId ? (
                      <div>
                        <dt>Snapshot</dt>
                        <dd>{preview.snapshotId}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {preview.blockingReasons.length > 0 ? (
                    <ul className="ai-knowledge-preview-list">
                      {preview.blockingReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  ) : null}
                  {preview.warnings.length > 0 ? (
                    <ul className="ai-knowledge-preview-list ai-knowledge-preview-list--warn">
                      {preview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                  {preview.missingContext.length > 0 ? (
                    <ul className="ai-knowledge-preview-list">
                      {preview.missingContext.map((entry) => (
                        <li key={`${entry.code}-${entry.message}`}>
                          [{entry.severity}] {entry.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <pre className="code-preview ai-knowledge-code-preview">{preview.contextPreview}</pre>
                </div>
              ) : null}
            </SectionPanel>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
