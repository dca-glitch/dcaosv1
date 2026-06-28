import React, { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  AiContextPreviewResponse,
  AiKnowledgeItemInputRequest,
  AiKnowledgeItemSummary
} from "@dca-os-v1/shared";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { SectionPanel, StatusBadge } from "../../components/ui";
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
    <Modal onClose={onClose} title="AI Knowledge & Context Preview">
      {error ? <ErrorState title="Knowledge panel blocked" message={error} /> : null}
      {loading ? <LoadingState label="Loading knowledge items…" /> : null}

      {!loading ? (
        <div className="stack gap-md">
          <SectionPanel title="Knowledge items" description="Approved + allowedForPrompt items are included in context by default.">
            {items.length === 0 ? (
              <EmptyState title="No knowledge items" message="Create a RAW item, then approve it for prompt use." />
            ) : (
              <div className="table-scroll">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Prompt</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.type}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td>{item.allowedForPrompt ? "Yes" : "No"}</td>
                        <td>
                          {item.status !== "APPROVED" ? (
                            <button className="secondary-action" disabled={saving} onClick={() => void handleApprove(item)} type="button">
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

          <SectionPanel title="Create knowledge item">
            <form className="stack gap-sm" onSubmit={(event) => void handleCreate(event)}>
              <label className="form-field">
                <span>Title</span>
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="form-field">
                <span>Type</span>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AiKnowledgeItemInputRequest["type"] }))}>
                  {knowledgeTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Body</span>
                <textarea rows={3} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
              </label>
              <button className="primary-action" disabled={saving || !form.title.trim()} type="submit">Create RAW item</button>
            </form>
          </SectionPanel>

          <SectionPanel title="Context preview (dry-run)" description="No provider call. Preview only.">
            <div className="stack gap-sm">
              <label className="form-field">
                <span>Workflow type</span>
                <select value={workflowType} onChange={(event) => setWorkflowType(event.target.value)}>
                  <option value="dry_run">dry_run</option>
                  <option value="article_draft">article_draft</option>
                  <option value="content_plan_draft">content_plan_draft</option>
                  <option value="summary">summary</option>
                </select>
              </label>
              <label className="checkbox-field">
                <input checked={includeRaw} onChange={(event) => setIncludeRaw(event.target.checked)} type="checkbox" />
                <span>Include raw/reviewed (with warning)</span>
              </label>
              <label className="checkbox-field">
                <input checked={saveSnapshot} onChange={(event) => setSaveSnapshot(event.target.checked)} type="checkbox" />
                <span>Save snapshot</span>
              </label>
              <button className="secondary-action" disabled={previewLoading} onClick={() => void handlePreview()} type="button">
                Preview AI context
              </button>
            </div>

            {previewLoading ? <LoadingState label="Building context preview…" /> : null}
            {preview ? (
              <div className="stack gap-sm preview-block">
                <p><strong>Can run:</strong> {preview.canRun ? "Yes" : "No"}</p>
                <p><strong>Token estimate:</strong> {preview.tokenEstimate}</p>
                <p><strong>Selected sources:</strong> {preview.selectedSources.length}</p>
                {preview.snapshotId ? <p><strong>Snapshot:</strong> {preview.snapshotId}</p> : null}
                {preview.blockingReasons.length > 0 ? (
                  <ul>{preview.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                ) : null}
                {preview.warnings.length > 0 ? (
                  <ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                ) : null}
                {preview.missingContext.length > 0 ? (
                  <ul>
                    {preview.missingContext.map((entry) => (
                      <li key={`${entry.code}-${entry.message}`}>[{entry.severity}] {entry.message}</li>
                    ))}
                  </ul>
                ) : null}
                <pre className="code-preview">{preview.contextPreview}</pre>
              </div>
            ) : null}
          </SectionPanel>
        </div>
      ) : null}
    </Modal>
  );
}
