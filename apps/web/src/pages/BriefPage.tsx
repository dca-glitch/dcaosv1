import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Badge, Button, PageHeader, SectionPanel } from "../components/ui";
import { Alert, Input, Select, Spinner, Textarea } from "../design-system";
import {
  clientPortalApiRequest,
  getClientPortalAuthToken,
  navigateToClientPortalHash,
  type ApiResponse
} from "./client-portal/client-portal-api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

const POLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

type BriefType = "MONTHLY" | "ADDITIONAL";
type BriefStatus = "DRAFT" | "AWAITING_CLIENT" | "SUBMITTED";

type BriefRecord = {
  id: string;
  companyId: string;
  clientId: string;
  briefNumber: number;
  targetGroup: string | null;
  hubCount: number;
  geoSeoCount: number;
  lifestyleCount: number;
  otherCount: number;
  type: BriefType;
  month: number | null;
  year: number | null;
  title: string;
  content: string;
  status: BriefStatus;
  submittedById: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BriefClientSummary = {
  id: string;
  name: string;
  isArchived: boolean;
};

type ClientsListResponse = {
  clients: BriefClientSummary[];
};

type MyClientResponse = {
  clientId: string;
  clientName: string;
};

type AuthMeResponse = {
  tenantContext: {
    activeMembership: {
      roles: string[];
    } | null;
  };
};

function isOwnerOrAdminRole(roles: string[]): boolean {
  return roles.includes("owner") || roles.includes("admin");
}

type EditorState = {
  open: boolean;
  mode: "create" | "edit";
  briefId?: string;
  type: BriefType;
};

type BriefPlanningFields = {
  targetGroup: string;
  hubCount: number;
  geoSeoCount: number;
  lifestyleCount: number;
  otherCount: number;
};

type MonthlyBriefFields = BriefPlanningFields & {
  productsToPromote: string;
  additionalNotes: string;
};

type AdditionalBriefFields = BriefPlanningFields & {
  topic: string;
  urgency: string;
  description: string;
  notes: string;
};

const EMPTY_PLANNING_FIELDS: BriefPlanningFields = {
  targetGroup: "",
  hubCount: 0,
  geoSeoCount: 0,
  lifestyleCount: 0,
  otherCount: 0
};

const EMPTY_MONTHLY_FIELDS: MonthlyBriefFields = {
  ...EMPTY_PLANNING_FIELDS,
  productsToPromote: "",
  additionalNotes: ""
};

const EMPTY_ADDITIONAL_FIELDS: AdditionalBriefFields = {
  ...EMPTY_PLANNING_FIELDS,
  topic: "",
  urgency: "",
  description: "",
  notes: ""
};

const TARGET_GROUP_OPTIONS = [
  { value: "", label: "— Select target group —" },
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "MIXED", label: "All genders" },
  { value: "LOCAL", label: "Local residents" },
  { value: "EXPAT", label: "Expatriates" },
  { value: "TOURIST", label: "Tourists / visitors" }
] as const;

const URGENCY_OPTIONS = [
  { value: "", label: "— Select urgency —" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" }
] as const;

const ARTICLE_COUNTER_FIELDS = [
  { key: "hubCount" as const, label: "Hub" },
  { key: "geoSeoCount" as const, label: "Geo SEO" },
  { key: "lifestyleCount" as const, label: "Lifestyle" },
  { key: "otherCount" as const, label: "Other" }
];

const MONTHLY_PRODUCTS_FIELD = {
  key: "productsToPromote" as const,
  label: "Products & Services to Promote",
  placeholder: "List specific treatments, products or packages..."
};

const MONTHLY_NOTES_FIELD = {
  key: "additionalNotes" as const,
  label: "Notes",
  placeholder: "Communication tone, restrictions, other guidelines..."
};

const MONTHLY_READONLY_CONTENT_FIELDS = [
  { key: "productsToPromote" as const, label: "Products & Services to Promote" },
  { key: "additionalNotes" as const, label: "Notes" }
] as const;

function BriefSectionHeading({ children }: { children: string }) {
  return (
    <h3
      className="brief-section-heading"
      style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem" }}
    >
      {children}
    </h3>
  );
}

function BriefAiResearchPlaceholder() {
  return (
    <div className="brief-section brief-section--ai-research" style={{ marginTop: "1.5rem" }}>
      <BriefSectionHeading>AI Research & Market Intelligence</BriefSectionHeading>
      <div
        className="brief-ai-research-placeholder"
        style={{
          border: "1px dashed rgba(148, 163, 184, 0.35)",
          borderRadius: "8px",
          background: "rgba(148, 163, 184, 0.06)",
          padding: "1rem 1.25rem"
        }}
      >
        <p className="muted-text" style={{ margin: 0 }}>
          AI research will appear here after your brief is processed by the DCA team.
        </p>
      </div>
    </div>
  );
}

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }
  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

async function briefsApiRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<ApiResponse<T>> {
  const token = getClientPortalAuthToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Check your connection and try again."
      }
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "The server returned an unreadable response."
      }
    };
  }

  if (!isApiEnvelope<T>(payload)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENVELOPE",
        message: "The server response was not in the expected format."
      }
    };
  }

  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message: "Request could not be completed."
      }
    };
  }

  return payload;
}

function formatBriefDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()}`;
}

function parseCounterInput(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function targetGroupLabel(value: string): string {
  if (!value.trim()) {
    return "—";
  }
  return TARGET_GROUP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function urgencyLabel(value: string): string {
  if (!value.trim()) {
    return "—";
  }
  return URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function planningFieldsFromBrief(brief: BriefRecord): BriefPlanningFields {
  return {
    targetGroup: brief.targetGroup ?? "",
    hubCount: brief.hubCount ?? 0,
    geoSeoCount: brief.geoSeoCount ?? 0,
    lifestyleCount: brief.lifestyleCount ?? 0,
    otherCount: brief.otherCount ?? 0
  };
}

function extractPlanningPayload(fields: BriefPlanningFields) {
  return {
    targetGroup: fields.targetGroup.trim() ? fields.targetGroup.trim() : null,
    hubCount: fields.hubCount,
    geoSeoCount: fields.geoSeoCount,
    lifestyleCount: fields.lifestyleCount,
    otherCount: fields.otherCount
  };
}

type MonthlyContentFields = Pick<MonthlyBriefFields, "productsToPromote" | "additionalNotes">;

function parseMonthlyContent(content: string): MonthlyContentFields {
  try {
    const parsed = JSON.parse(content) as Partial<MonthlyContentFields>;
    if (parsed && typeof parsed === "object") {
      return {
        productsToPromote: parsed.productsToPromote ?? "",
        additionalNotes: parsed.additionalNotes ?? ""
      };
    }
  } catch {
    return { productsToPromote: content, additionalNotes: "" };
  }
  return {
    productsToPromote: "",
    additionalNotes: ""
  };
}

function serializeMonthlyContent(fields: MonthlyContentFields, originalContent?: string): string {
  let base: Record<string, unknown> = {};
  if (originalContent) {
    try {
      const parsed = JSON.parse(originalContent);
      if (parsed && typeof parsed === "object") {
        base = { ...parsed };
      }
    } catch {
      base = { monthlyTheme: originalContent };
    }
  }
  return JSON.stringify({
    ...base,
    productsToPromote: fields.productsToPromote,
    additionalNotes: fields.additionalNotes
  });
}

function monthlyContentFromFields(fields: MonthlyBriefFields): MonthlyContentFields {
  return {
    productsToPromote: fields.productsToPromote,
    additionalNotes: fields.additionalNotes
  };
}

type AdditionalContentFields = Omit<AdditionalBriefFields, keyof BriefPlanningFields>;

function parseAdditionalContent(content: string): AdditionalContentFields {
  try {
    const parsed = JSON.parse(content) as Partial<AdditionalContentFields & { body?: string; title?: string }>;
    if (parsed && typeof parsed === "object") {
      return {
        topic: parsed.topic ?? parsed.title ?? "",
        urgency: parsed.urgency ?? "",
        description: parsed.description ?? parsed.body ?? "",
        notes: parsed.notes ?? ""
      };
    }
  } catch {
    return { topic: "", urgency: "", description: content, notes: "" };
  }
  return { topic: "", urgency: "", description: "", notes: "" };
}

function serializeAdditionalContent(fields: AdditionalContentFields): string {
  return JSON.stringify({
    topic: fields.topic,
    urgency: fields.urgency,
    description: fields.description,
    notes: fields.notes
  });
}

function additionalContentFromFields(fields: AdditionalBriefFields): AdditionalContentFields {
  return {
    topic: fields.topic,
    urgency: fields.urgency,
    description: fields.description,
    notes: fields.notes
  };
}

function getBriefStatusBadge(
  status: string,
  role: string
): { label: string; color: "amber" | "blue" | "green" } {
  if (status === "DRAFT") return { label: "Draft", color: "amber" };
  if (status === "SUBMITTED") return { label: "Submitted", color: "green" };
  if (status === "AWAITING_CLIENT") {
    return role === "client"
      ? { label: "Awaiting your input", color: "blue" }
      : { label: "Sent to Client", color: "blue" };
  }
  return { label: status, color: "amber" };
}

function briefBadgeVariant(color: "amber" | "blue" | "green"): "success" | "info" | "warning" {
  if (color === "green") return "success";
  if (color === "blue") return "info";
  return "warning";
}

function isBriefReadOnly(status: BriefStatus, isAdmin: boolean): boolean {
  if (status === "SUBMITTED") return true;
  if (status === "AWAITING_CLIENT" && isAdmin) return true;
  return false;
}

function canSubmitBrief(status: BriefStatus | undefined, isAdmin: boolean): boolean {
  if (!status || status === "DRAFT") return true;
  if (status === "SUBMITTED") return false;
  if (status === "AWAITING_CLIENT" && isAdmin) return false;
  return true;
}

function monthlyBriefTitle(month: number, year: number): string {
  return `Brief — ${POLISH_MONTHS[month - 1]} ${year}`;
}

function BriefAutoTitleDisplay({ title, isNew }: { title?: string | null; isNew?: boolean }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <span className="muted-text text-small">Brief title</span>
      <p style={{ fontWeight: 600, margin: "0.25rem 0 0" }}>
        {isNew ? "Assigned automatically when you save" : title?.trim() || "—"}
      </p>
    </div>
  );
}

type BriefPlanningSectionProps<T extends BriefPlanningFields> = {
  fields: T;
  readOnly: boolean;
  idPrefix: string;
  onChange: (fields: T) => void;
};

function BriefPlanningSection<T extends BriefPlanningFields>({
  fields,
  readOnly,
  idPrefix,
  onChange
}: BriefPlanningSectionProps<T>) {
  return (
    <>
      <Select
        className="entity-form"
        disabled={readOnly}
        fullWidth
        id={`${idPrefix}-target-group`}
        label="Target Group"
        onChange={(event) => onChange({ ...fields, targetGroup: event.target.value })}
        options={TARGET_GROUP_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        value={fields.targetGroup}
      />

      <fieldset className="brief-article-counters" style={{ border: "none", margin: "0 0 1rem", padding: 0 }}>
        <legend className="field-label" style={{ marginBottom: "0.5rem" }}>
          Article types
        </legend>
        <div
          className="brief-counter-grid"
          style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
        >
          {ARTICLE_COUNTER_FIELDS.map((counter) => (
            <Input
              className="entity-form"
              disabled={readOnly}
              fullWidth
              id={`${idPrefix}-${counter.key}`}
              key={counter.key}
              label={counter.label}
              min={0}
              onChange={(event) =>
                onChange({ ...fields, [counter.key]: parseCounterInput(event.target.value) } as T)
              }
              step={1}
              type="number"
              value={fields[counter.key]}
            />
          ))}
        </div>
      </fieldset>
    </>
  );
}

function BriefPlanningReadOnly({ fields }: { fields: BriefPlanningFields }) {
  const totalArticles =
    fields.hubCount + fields.geoSeoCount + fields.lifestyleCount + fields.otherCount;

  return (
    <dl className="field-grid">
      <div>
        <dt>Target Group</dt>
        <dd>{targetGroupLabel(fields.targetGroup)}</dd>
      </div>
      <div>
        <dt>Article types</dt>
        <dd>
          Hub {fields.hubCount} · Geo SEO {fields.geoSeoCount} · Lifestyle {fields.lifestyleCount} · Other{" "}
          {fields.otherCount}
          {totalArticles > 0 ? ` (${totalArticles} total)` : ""}
        </dd>
      </div>
    </dl>
  );
}

function BriefStatusBadge({ status, role }: { status: string; role: string }) {
  const badge = getBriefStatusBadge(status, role);
  return <Badge variant={briefBadgeVariant(badge.color)}>{badge.label}</Badge>;
}

function PortalInlineLoading({ label }: { label: string }) {
  return (
    <p className="cf-inline-loading" role="status">
      <Spinner size="sm" />
      {label}
    </p>
  );
}

function BriefAwaitingClientInfoBanner() {
  return (
    <div
      className="portal-inline-notice"
      role="note"
      style={{
        background: "rgba(96, 165, 250, 0.08)",
        borderColor: "rgba(96, 165, 250, 0.28)",
        color: "rgba(147, 197, 253, 0.96)",
        marginBottom: "1rem"
      }}
    >
      <p>
        Your team has prepared this brief for you. Please review, fill in the details, and send it to DCA.
      </p>
    </div>
  );
}

type MonthlyBriefEditorProps = {
  fields: MonthlyBriefFields;
  autoTitle?: string | null;
  isNew?: boolean;
  readOnly: boolean;
  saving: boolean;
  submitting: boolean;
  submitLabel: string;
  showSubmit: boolean;
  showAwaitingClientBanner?: boolean;
  onChange: (fields: MonthlyBriefFields) => void;
  onSave: () => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

function MonthlyBriefEditor({
  fields,
  autoTitle,
  isNew = false,
  readOnly,
  saving,
  submitting,
  submitLabel,
  showSubmit,
  showAwaitingClientBanner = false,
  onChange,
  onSave,
  onSubmit,
  onCancel
}: MonthlyBriefEditorProps) {
  return (
    <div className="brief-editor">
      {showAwaitingClientBanner ? <BriefAwaitingClientInfoBanner /> : null}
      <BriefAutoTitleDisplay isNew={isNew} title={autoTitle} />

      <div className="brief-section brief-section--initial">
        <BriefSectionHeading>Initial Brief</BriefSectionHeading>

        <Select
          className="entity-form"
          disabled={readOnly}
          fullWidth
          id="monthly-target-group"
          label="Target Group"
          onChange={(event) => onChange({ ...fields, targetGroup: event.target.value })}
          options={TARGET_GROUP_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          value={fields.targetGroup}
        />

        <Textarea
          className="entity-form"
          disabled={readOnly}
          fullWidth
          id={`monthly-${MONTHLY_PRODUCTS_FIELD.key}`}
          label={MONTHLY_PRODUCTS_FIELD.label}
          onChange={(event) => onChange({ ...fields, productsToPromote: event.target.value })}
          placeholder={MONTHLY_PRODUCTS_FIELD.placeholder}
          rows={4}
          value={fields.productsToPromote}
        />

        <fieldset className="brief-article-counters" style={{ border: "none", margin: "0 0 1rem", padding: 0 }}>
          <legend className="field-label" style={{ marginBottom: "0.5rem" }}>
            Article types
          </legend>
          <div
            className="brief-counter-grid"
            style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
          >
            {ARTICLE_COUNTER_FIELDS.map((counter) => (
              <Input
                className="entity-form"
                disabled={readOnly}
                fullWidth
                id={`monthly-${counter.key}`}
                key={counter.key}
                label={counter.label}
                min={0}
                onChange={(event) =>
                  onChange({ ...fields, [counter.key]: parseCounterInput(event.target.value) })
                }
                step={1}
                type="number"
                value={fields[counter.key]}
              />
            ))}
          </div>
        </fieldset>

        <Textarea
          className="entity-form"
          disabled={readOnly}
          fullWidth
          id={`monthly-${MONTHLY_NOTES_FIELD.key}`}
          label={MONTHLY_NOTES_FIELD.label}
          onChange={(event) => onChange({ ...fields, additionalNotes: event.target.value })}
          placeholder={MONTHLY_NOTES_FIELD.placeholder}
          rows={4}
          value={fields.additionalNotes}
        />
      </div>

      <BriefAiResearchPlaceholder />

      {!readOnly ? (
        <div className="form-actions">
          {onCancel ? (
            <Button disabled={saving || submitting} onClick={onCancel} variant="tertiary">
              Cancel
            </Button>
          ) : null}
          <Button disabled={saving || submitting} onClick={onSave} variant="secondary">
            {saving ? "Saving…" : "Save Draft"}
          </Button>
          {showSubmit ? (
            <Button disabled={saving || submitting} onClick={onSubmit}>
              {submitting ? "Sending…" : submitLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type AdditionalBriefEditorProps = {
  fields: AdditionalBriefFields;
  autoTitle?: string | null;
  isNew?: boolean;
  readOnly: boolean;
  saving: boolean;
  submitting: boolean;
  submitLabel: string;
  showSubmit: boolean;
  showAwaitingClientBanner?: boolean;
  onChange: (fields: AdditionalBriefFields) => void;
  onSave: () => void;
  onSubmit: () => void;
  onClose: () => void;
};

function AdditionalBriefEditor({
  fields,
  autoTitle,
  isNew = false,
  readOnly,
  saving,
  submitting,
  submitLabel,
  showSubmit,
  showAwaitingClientBanner = false,
  onChange,
  onSave,
  onSubmit,
  onClose
}: AdditionalBriefEditorProps) {
  return (
    <div className="brief-editor">
      {showAwaitingClientBanner ? <BriefAwaitingClientInfoBanner /> : null}
      <BriefAutoTitleDisplay isNew={isNew} title={autoTitle} />
      <BriefPlanningSection fields={fields} idPrefix="additional" onChange={onChange} readOnly={readOnly} />

      <Input
        className="entity-form"
        disabled={readOnly}
        fullWidth
        id="additional-brief-topic"
        label="Topic"
        onChange={(event) => onChange({ ...fields, topic: event.target.value })}
        placeholder="e.g. Summer campaign, new treatment…"
        type="text"
        value={fields.topic}
      />

      <Select
        className="entity-form"
        disabled={readOnly}
        fullWidth
        id="additional-brief-urgency"
        label="Urgency"
        onChange={(event) => onChange({ ...fields, urgency: event.target.value })}
        options={URGENCY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        value={fields.urgency}
      />

      <Textarea
        className="entity-form"
        disabled={readOnly}
        fullWidth
        id="additional-brief-description"
        label="Description / Guidelines"
        onChange={(event) => onChange({ ...fields, description: event.target.value })}
        placeholder="Describe the topic, goal and guidelines for DCA..."
        rows={8}
        value={fields.description}
      />

      <Textarea
        className="entity-form"
        disabled={readOnly}
        fullWidth
        id="additional-brief-notes"
        label="Notes"
        onChange={(event) => onChange({ ...fields, notes: event.target.value })}
        placeholder="Extra context, restrictions, or references..."
        rows={4}
        value={fields.notes}
      />

      <div className="form-actions">
        <Button onClick={onClose} variant="tertiary">
          Close
        </Button>
        {!readOnly ? (
          <>
            <Button disabled={saving || submitting} onClick={onSave} variant="secondary">
              {saving ? "Saving…" : "Save Draft"}
            </Button>
            {showSubmit ? (
              <Button disabled={saving || submitting} onClick={onSubmit}>
                {submitting ? "Sending…" : submitLabel}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

type MonthlyBriefReadOnlyProps = {
  fields: MonthlyBriefFields;
  autoTitle?: string | null;
};

function MonthlyBriefReadOnly({ fields, autoTitle }: MonthlyBriefReadOnlyProps) {
  const totalArticles =
    fields.hubCount + fields.geoSeoCount + fields.lifestyleCount + fields.otherCount;

  return (
    <>
      <BriefAutoTitleDisplay title={autoTitle} />

      <div className="brief-section brief-section--initial">
        <BriefSectionHeading>Initial Brief</BriefSectionHeading>
        <dl className="field-grid">
          <div>
            <dt>Target Group</dt>
            <dd>{targetGroupLabel(fields.targetGroup)}</dd>
          </div>
          <div>
            <dt>{MONTHLY_READONLY_CONTENT_FIELDS[0].label}</dt>
            <dd className="pre-wrap-block">
              {fields.productsToPromote.trim() ? fields.productsToPromote : "—"}
            </dd>
          </div>
          <div>
            <dt>Article types</dt>
            <dd>
              Hub {fields.hubCount} · Geo SEO {fields.geoSeoCount} · Lifestyle {fields.lifestyleCount} · Other{" "}
              {fields.otherCount}
              {totalArticles > 0 ? ` (${totalArticles} total)` : ""}
            </dd>
          </div>
          <div>
            <dt>{MONTHLY_READONLY_CONTENT_FIELDS[1].label}</dt>
            <dd className="pre-wrap-block">
              {fields.additionalNotes.trim() ? fields.additionalNotes : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <BriefAiResearchPlaceholder />
    </>
  );
}

type AdditionalBriefReadOnlyProps = {
  fields: AdditionalBriefFields;
  autoTitle?: string | null;
};

function AdditionalBriefReadOnly({ fields, autoTitle }: AdditionalBriefReadOnlyProps) {
  return (
    <>
      <BriefAutoTitleDisplay title={autoTitle} />
      <BriefPlanningReadOnly fields={fields} />
      <dl className="field-grid">
        <div>
          <dt>Topic</dt>
          <dd className="pre-wrap-block">{fields.topic.trim() ? fields.topic : "—"}</dd>
        </div>
        <div>
          <dt>Urgency</dt>
          <dd>{urgencyLabel(fields.urgency)}</dd>
        </div>
        <div>
          <dt>Description / Guidelines</dt>
          <dd className="pre-wrap-block">{fields.description.trim() ? fields.description : "—"}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd className="pre-wrap-block">{fields.notes.trim() ? fields.notes : "—"}</dd>
        </div>
      </dl>
    </>
  );
}

export function BriefPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentMonthLabel = POLISH_MONTHS[currentMonth - 1];

  const [clients, setClients] = useState<BriefClientSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [showNewAdditionalEditor, setShowNewAdditionalEditor] = useState(false);
  const [briefs, setBriefs] = useState<BriefRecord[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    open: false,
    mode: "create",
    type: "MONTHLY"
  });
  const [monthlyFields, setMonthlyFields] = useState<MonthlyBriefFields>(EMPTY_MONTHLY_FIELDS);
  const [additionalFields, setAdditionalFields] = useState<AdditionalBriefFields>(EMPTY_ADDITIONAL_FIELDS);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isAdminViewer, setIsAdminViewer] = useState(false);

  const viewerRole = isAdminViewer ? "admin" : "client";
  const submitLabel = viewerRole === "client" ? "Send to DCA" : "Send to Client";
  const submitConfirmMessage =
    viewerRole === "client"
      ? "Are you sure you want to send this brief? It cannot be edited after submission."
      : "Are you sure you want to send this brief to the client? It cannot be edited after submission.";
  const submitSuccessMessage =
    viewerRole === "client" ? "Brief sent to DCA ✓" : "Brief sent to client ✓";

  const activeClients = useMemo(
    () => clients.filter((client) => !client.isArchived),
    [clients]
  );

  const hasSelectedClient = Boolean(selectedClientId?.trim());

  const selectedClient = useMemo(
    () => activeClients.find((client) => client.id === selectedClientId) ?? null,
    [activeClients, selectedClientId]
  );

  const monthlyBrief = useMemo(
    () =>
      briefs.find(
        (brief) => brief.type === "MONTHLY" && brief.month === currentMonth && brief.year === currentYear
      ),
    [briefs, currentMonth, currentYear]
  );

  const additionalBriefs = useMemo(
    () =>
      briefs
        .filter((brief) => brief.type === "ADDITIONAL")
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [briefs]
  );

  const activeAdditionalBrief = useMemo(() => {
    if (!editorState.open || editorState.type !== "ADDITIONAL" || !editorState.briefId) {
      return null;
    }
    return additionalBriefs.find((brief) => brief.id === editorState.briefId) ?? null;
  }, [additionalBriefs, editorState]);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    setError(null);

    const meResponse = await briefsApiRequest<AuthMeResponse>("/auth/me");
    const roles = meResponse.ok ? meResponse.data.tenantContext.activeMembership?.roles ?? [] : [];
    const adminViewer = isOwnerOrAdminRole(roles);
    setIsAdminViewer(adminViewer);

    if (adminViewer) {
      const response = await briefsApiRequest<ClientsListResponse>("/clients");
      if (!response.ok) {
        setClients([]);
        setSelectedClientId(null);
        setClientName(null);
        setError(response.error.message);
        setLoadingClients(false);
        return;
      }

      const nextClients = (response.data.clients ?? []).filter((client) => !client.isArchived);
      setClients(nextClients);
      setSelectedClientId((current) => {
        if (current && nextClients.some((client) => client.id === current)) {
          return current;
        }
        return nextClients[0]?.id ?? null;
      });
      setLoadingClients(false);
      return;
    }

    const response = await clientPortalApiRequest<MyClientResponse>("/my-client");
    if (!response.ok) {
      setClients([]);
      setSelectedClientId(null);
      setClientName(null);
      setError(response.error.message);
      setLoadingClients(false);
      return;
    }

    setSelectedClientId(response.data.clientId);
    setClientName(response.data.clientName);
    setClients([
      {
        id: response.data.clientId,
        name: response.data.clientName,
        isArchived: false
      }
    ]);
    setLoadingClients(false);
  }, []);

  const loadBriefs = useCallback(async (clientId: string) => {
    setLoadingBriefs(true);
    setError(null);
    setActionError(null);

    const response = await briefsApiRequest<BriefRecord[]>(`/briefs?clientId=${encodeURIComponent(clientId)}`);
    if (!response.ok) {
      setBriefs([]);
      setError(response.error.message);
      setLoadingBriefs(false);
      return;
    }

    setBriefs(response.data ?? []);
    setLoadingBriefs(false);
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!selectedClientId) {
      setBriefs([]);
      return;
    }
    void loadBriefs(selectedClientId);
  }, [loadBriefs, selectedClientId]);

  useEffect(() => {
    if (monthlyBrief) {
      setMonthlyFields({
        ...parseMonthlyContent(monthlyBrief.content),
        ...planningFieldsFromBrief(monthlyBrief)
      });
      return;
    }
    setMonthlyFields(EMPTY_MONTHLY_FIELDS);
  }, [monthlyBrief]);

  useEffect(() => {
    if (showNewAdditionalEditor) {
      setAdditionalFields(EMPTY_ADDITIONAL_FIELDS);
      return;
    }
    if (editorState.open && editorState.type === "ADDITIONAL" && editorState.mode === "edit" && activeAdditionalBrief) {
      setAdditionalFields({
        ...parseAdditionalContent(activeAdditionalBrief.content),
        ...planningFieldsFromBrief(activeAdditionalBrief)
      });
    }
  }, [activeAdditionalBrief, editorState, showNewAdditionalEditor]);

  const reloadBriefs = useCallback(async () => {
    if (!selectedClientId) return;
    await loadBriefs(selectedClientId);
  }, [loadBriefs, selectedClientId]);

  const handleSaveMonthly = useCallback(async () => {
    if (!selectedClientId) return;

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const content = serializeMonthlyContent(
      monthlyContentFromFields(monthlyFields),
      monthlyBrief?.content
    );
    const planningPayload = extractPlanningPayload(monthlyFields);

    const response = monthlyBrief
      ? await briefsApiRequest<BriefRecord>(`/briefs/${monthlyBrief.id}`, {
          method: "PATCH",
          body: { content, ...planningPayload }
        })
      : await briefsApiRequest<BriefRecord>("/briefs", {
          method: "POST",
          body: {
            clientId: selectedClientId,
            type: "MONTHLY",
            content,
            month: currentMonth,
            year: currentYear,
            ...planningPayload
          }
        });

    setSaving(false);

    if (!response.ok) {
      setActionError(
        response.error.code === "BRIEF_ALREADY_EXISTS"
          ? "A brief for this month already exists"
          : response.error.message
      );
      return;
    }

    setEditorState({ open: false, mode: "create", type: "MONTHLY" });
    await reloadBriefs();
  }, [currentMonth, currentYear, monthlyBrief, monthlyFields, reloadBriefs, selectedClientId]);

  const handleSubmitMonthly = useCallback(async () => {
    if (!selectedClientId) return;

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const content = serializeMonthlyContent(
      monthlyContentFromFields(monthlyFields),
      monthlyBrief?.content
    );
    const planningPayload = extractPlanningPayload(monthlyFields);

    let briefId = monthlyBrief?.id;

    if (!briefId) {
      const createResponse = await briefsApiRequest<BriefRecord>("/briefs", {
        method: "POST",
        body: {
          clientId: selectedClientId,
          type: "MONTHLY",
          content,
          month: currentMonth,
          year: currentYear,
          ...planningPayload
        }
      });
      if (!createResponse.ok) {
        setSubmitting(false);
        setActionError(
          createResponse.error.code === "BRIEF_ALREADY_EXISTS"
            ? "A brief for this month already exists"
            : createResponse.error.message
        );
        return;
      }
      briefId = createResponse.data.id;
    } else {
      const patchResponse = await briefsApiRequest<BriefRecord>(`/briefs/${briefId}`, {
        method: "PATCH",
        body: { content, ...planningPayload }
      });
      if (!patchResponse.ok) {
        setSubmitting(false);
        setActionError(patchResponse.error.message);
        return;
      }
    }

    const submitResponse = await briefsApiRequest<BriefRecord>(`/briefs/${briefId}/submit`, {
      method: "POST"
    });

    setSubmitting(false);

    if (!submitResponse.ok) {
      setActionError(submitResponse.error.message);
      return;
    }

    setEditorState({ open: false, mode: "create", type: "MONTHLY" });
    await reloadBriefs();
    setActionSuccess(submitSuccessMessage);
  }, [currentMonth, currentYear, monthlyBrief, monthlyFields, reloadBriefs, selectedClientId, submitSuccessMessage]);

  const handleSaveAdditional = useCallback(async () => {
    if (!selectedClientId) return;
    if (!additionalFields.topic.trim() || !additionalFields.description.trim()) {
      setActionError("Topic and description are required.");
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const content = serializeAdditionalContent(additionalContentFromFields(additionalFields));
    const planningPayload = extractPlanningPayload(additionalFields);
    const payload = { content, ...planningPayload };

    const response =
      !showNewAdditionalEditor && editorState.mode === "edit" && editorState.briefId
        ? await briefsApiRequest<BriefRecord>(`/briefs/${editorState.briefId}`, {
            method: "PATCH",
            body: payload
          })
        : await briefsApiRequest<BriefRecord>("/briefs", {
            method: "POST",
            body: {
              clientId: selectedClientId,
              type: "ADDITIONAL",
              ...payload
            }
          });

    setSaving(false);

    if (!response.ok) {
      setActionError(response.error.message);
      return;
    }

    if (showNewAdditionalEditor) {
      setShowNewAdditionalEditor(false);
      setAdditionalFields(EMPTY_ADDITIONAL_FIELDS);
    } else if (editorState.mode === "create" && response.data?.id) {
      setEditorState({ open: true, mode: "edit", type: "ADDITIONAL", briefId: response.data.id });
    }

    await reloadBriefs();
  }, [
    additionalFields,
    editorState.briefId,
    editorState.mode,
    reloadBriefs,
    selectedClientId,
    showNewAdditionalEditor
  ]);

  const handleSubmitAdditional = useCallback(async () => {
    if (!selectedClientId) return;
    if (!additionalFields.topic.trim() || !additionalFields.description.trim()) {
      setActionError("Topic and description are required.");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const content = serializeAdditionalContent(additionalContentFromFields(additionalFields));
    const planningPayload = extractPlanningPayload(additionalFields);
    const payload = { content, ...planningPayload };

    let briefId = showNewAdditionalEditor ? undefined : editorState.briefId;

    if (!briefId) {
      const createResponse = await briefsApiRequest<BriefRecord>("/briefs", {
        method: "POST",
        body: {
          clientId: selectedClientId,
          type: "ADDITIONAL",
          ...payload
        }
      });
      if (!createResponse.ok) {
        setSubmitting(false);
        setActionError(createResponse.error.message);
        return;
      }
      briefId = createResponse.data.id;
    } else {
      const patchResponse = await briefsApiRequest<BriefRecord>(`/briefs/${briefId}`, {
        method: "PATCH",
        body: payload
      });
      if (!patchResponse.ok) {
        setSubmitting(false);
        setActionError(patchResponse.error.message);
        return;
      }
    }

    const submitResponse = await briefsApiRequest<BriefRecord>(`/briefs/${briefId}/submit`, {
      method: "POST"
    });

    setSubmitting(false);

    if (!submitResponse.ok) {
      setActionError(submitResponse.error.message);
      return;
    }

    setEditorState({ open: false, mode: "create", type: "ADDITIONAL" });
    setShowNewAdditionalEditor(false);
    await reloadBriefs();
    setActionSuccess(submitSuccessMessage);
  }, [additionalFields, editorState.briefId, reloadBriefs, selectedClientId, showNewAdditionalEditor, submitSuccessMessage]);

  const showMonthlyCreateEditor =
    !monthlyBrief && editorState.open && editorState.type === "MONTHLY" && editorState.mode === "create";

  const monthlyBriefSubmitted = monthlyBrief?.status === "SUBMITTED";

  const showAdditionalEditEditor =
    editorState.open &&
    editorState.type === "ADDITIONAL" &&
    editorState.mode === "edit" &&
    Boolean(editorState.briefId);

  const monthlyBriefReadOnly = monthlyBrief ? isBriefReadOnly(monthlyBrief.status, isAdminViewer) : false;

  const additionalBriefStatus = showNewAdditionalEditor
    ? "DRAFT"
    : editorState.mode === "create" && !editorState.briefId
      ? "DRAFT"
      : activeAdditionalBrief?.status;
  const additionalEditorReadOnly = activeAdditionalBrief
    ? isBriefReadOnly(activeAdditionalBrief.status, isAdminViewer)
    : false;

  const showMonthlyAwaitingClientBanner =
    !isAdminViewer && monthlyBrief?.status === "AWAITING_CLIENT";

  const showAdditionalAwaitingClientBanner =
    !isAdminViewer && activeAdditionalBrief?.status === "AWAITING_CLIENT";

  const requestSubmitMonthly = () => {
    if (!window.confirm(submitConfirmMessage)) return;
    void handleSubmitMonthly();
  };

  const requestSubmitAdditional = () => {
    if (!window.confirm(submitConfirmMessage)) return;
    void handleSubmitAdditional();
  };

  const openAdditionalCreateEditor = () => {
    setActionError(null);
    setActionSuccess(null);
    setEditorState({ open: false, mode: "create", type: "ADDITIONAL" });
    setAdditionalFields(EMPTY_ADDITIONAL_FIELDS);
    setShowNewAdditionalEditor(true);
  };

  const closeAdditionalCreateEditor = () => {
    setShowNewAdditionalEditor(false);
    setAdditionalFields(EMPTY_ADDITIONAL_FIELDS);
  };

  return (
    <section className="view-section cf-page" aria-labelledby="client-briefs-title" data-density="comfortable">
      <PageHeader
        action={
          <Button
            disabled={loadingClients || loadingBriefs || !hasSelectedClient}
            onClick={() => {
              if (selectedClientId) {
                void loadBriefs(selectedClientId);
              } else {
                void loadClients();
              }
            }}
            variant="tertiary"
          >
            Refresh
          </Button>
        }
        description="Client briefs for your workspace."
        eyebrow="Client workspace"
        title="Briefs"
        titleId="client-briefs-title"
      />

      <nav aria-label="Client portal sections" className="portal-subnav">
        <Button className="portal-subnav-link" onClick={() => navigateToClientPortalHash("client-portal")} type="button" variant="tertiary">
          Archive
        </Button>
        <Button
          className="portal-subnav-link"
          onClick={() => navigateToClientPortalHash("client-portal/pending-approvals")}
          type="button"
          variant="tertiary"
        >
          Pending Approvals
        </Button>
        <Button className="portal-subnav-link is-active" type="button" variant="tertiary">
          Briefs
        </Button>
      </nav>

      {loadingClients && !hasSelectedClient ? <PortalInlineLoading label="Loading briefs" /> : null}

      {error && !hasSelectedClient ? (
        <>
          <Alert message={error} title="Briefs unavailable" variant="danger" />
          <div className="portal-action-row">
            <Button onClick={() => void loadClients()} variant="secondary">
              Try again
            </Button>
          </div>
        </>
      ) : null}

      {!hasSelectedClient && !loadingClients && !error ? (
        <EmptyState message="When your team shares a client workspace, briefs will appear here." title="No clients" />
      ) : hasSelectedClient ? (
        <>
          <SectionPanel
            description={
              isAdminViewer
                ? "Select the client you want to complete a brief for."
                : "Briefs for your client workspace."
            }
            title="Client"
            tone="compact"
          >
            {isAdminViewer ? (
              <div className="filter-bar" role="tablist" aria-label="Client selection">
                {activeClients.map((client) => (
                  <Button
                    aria-selected={client.id === selectedClientId}
                    className={
                      client.id === selectedClientId ? "filter-chip is-active" : "filter-chip"
                    }
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setEditorState({ open: false, mode: "create", type: "MONTHLY" });
                      setShowNewAdditionalEditor(false);
                      setActionError(null);
                      setActionSuccess(null);
                    }}
                    role="tab"
                    type="button"
                    variant="secondary"
                  >
                    {client.name}
                  </Button>
                ))}
              </div>
            ) : clientName || selectedClient ? (
              <p className="muted-text" style={{ margin: 0 }}>
                {clientName ?? selectedClient?.name ?? "Client"}
              </p>
            ) : null}
          </SectionPanel>

          {loadingBriefs ? <PortalInlineLoading label="Loading briefs" /> : null}

          {error ? <Alert message={error} title="Could not load briefs" variant="danger" /> : null}

          {hasSelectedClient ? (
            <>
              {actionError ? <Alert message={actionError} variant="danger" /> : null}

              {actionSuccess ? <Alert message={actionSuccess} variant="success" /> : null}

              <SectionPanel
                title={`Brief — ${currentMonthLabel} ${currentYear}`}
                description={
                  selectedClient
                    ? `Current month for ${selectedClient.name}.`
                    : "Current month."
                }
                tone="compact"
              >
                {monthlyBrief ? (
                  <div style={{ marginBottom: "1rem" }}>
                    <BriefStatusBadge role={viewerRole} status={monthlyBrief.status} />
                  </div>
                ) : null}

                {monthlyBrief &&
                monthlyBrief.status === "AWAITING_CLIENT" &&
                isAdminViewer ? (
                  <p className="muted-text" style={{ marginBottom: "1rem" }}>
                    Brief is with client.
                  </p>
                ) : null}

                {monthlyBriefSubmitted ? (
                  <p className="muted-text" style={{ marginBottom: "1rem" }}>
                    Brief submitted.
                  </p>
                ) : null}

                {monthlyBrief && monthlyBriefReadOnly ? (
                  <MonthlyBriefReadOnly autoTitle={monthlyBrief.title} fields={monthlyFields} />
                ) : null}

                {monthlyBrief && !monthlyBriefReadOnly ? (
                  <MonthlyBriefEditor
                    autoTitle={monthlyBrief.title}
                    fields={monthlyFields}
                    onChange={setMonthlyFields}
                    onSave={() => void handleSaveMonthly()}
                    onSubmit={requestSubmitMonthly}
                    readOnly={false}
                    saving={saving}
                    showAwaitingClientBanner={showMonthlyAwaitingClientBanner}
                    showSubmit={canSubmitBrief(monthlyBrief.status, isAdminViewer)}
                    submitLabel={submitLabel}
                    submitting={submitting}
                  />
                ) : null}

                {hasSelectedClient && !monthlyBrief && !showMonthlyCreateEditor ? (
                  <EmptyState
                    action={
                      <Button
                        onClick={() =>
                          setEditorState({ open: true, mode: "create", type: "MONTHLY" })
                        }
                      >
                        Create Brief
                      </Button>
                    }
                    message="No brief for this month"
                    title="Create brief"
                    variant="inline"
                  />
                ) : null}

                {showMonthlyCreateEditor ? (
                  <MonthlyBriefEditor
                    fields={monthlyFields}
                    isNew
                    onCancel={() => {
                      setEditorState({ open: false, mode: "create", type: "MONTHLY" });
                      setMonthlyFields(EMPTY_MONTHLY_FIELDS);
                    }}
                    onChange={setMonthlyFields}
                    onSave={() => void handleSaveMonthly()}
                    onSubmit={requestSubmitMonthly}
                    readOnly={false}
                    saving={saving}
                    showSubmit
                    submitLabel={submitLabel}
                    submitting={submitting}
                  />
                ) : null}
              </SectionPanel>

              <SectionPanel
                action={
                  hasSelectedClient && !showNewAdditionalEditor ? (
                    <Button onClick={openAdditionalCreateEditor} size="sm" variant="secondary">
                      + New Brief
                    </Button>
                  ) : undefined
                }
                description="Briefs outside the current month."
                title="Other briefs"
                tone="compact"
              >
                {additionalBriefs.length === 0 ? (
                  <p className="inline-empty muted-text">No other briefs.</p>
                ) : (
                  <div className="cf-record-list">
                    {additionalBriefs.map((brief) => {
                      const isSelected =
                        editorState.open &&
                        editorState.type === "ADDITIONAL" &&
                        editorState.briefId === brief.id;

                      return (
                        <article
                          className={`cf-record cf-record--selectable${isSelected ? " is-selected" : ""}`}
                          key={brief.id}
                          onClick={() => {
                            setShowNewAdditionalEditor(false);
                            setEditorState({
                              open: true,
                              mode: "edit",
                              type: "ADDITIONAL",
                              briefId: brief.id
                            });
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setShowNewAdditionalEditor(false);
                              setEditorState({
                                open: true,
                                mode: "edit",
                                type: "ADDITIONAL",
                                briefId: brief.id
                              });
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="cf-record-main">
                            <div className="cf-record-title">
                              <div className="cf-record-kicker">
                                <BriefStatusBadge role={viewerRole} status={brief.status} />
                              </div>
                              <h3>{brief.title}</h3>
                              <div className="cf-record-meta">
                                <span>{formatBriefDate(brief.createdAt)}</span>
                                {brief.submittedAt ? (
                                  <span>Submitted {formatBriefDate(brief.submittedAt)}</span>
                                ) : (
                                  <span>Updated {formatBriefDate(brief.updatedAt)}</span>
                                )}
                                {brief.targetGroup ? (
                                  <span>{targetGroupLabel(brief.targetGroup)}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {showNewAdditionalEditor ? (
                  <div style={{ marginTop: "1.5rem" }}>
                    <AdditionalBriefEditor
                      fields={additionalFields}
                      isNew
                      onChange={setAdditionalFields}
                      onClose={closeAdditionalCreateEditor}
                      onSave={() => void handleSaveAdditional()}
                      onSubmit={requestSubmitAdditional}
                      readOnly={false}
                      saving={saving}
                      showSubmit
                      submitLabel={submitLabel}
                      submitting={submitting}
                    />
                  </div>
                ) : null}

                {showAdditionalEditEditor ? (
                  <div style={{ marginTop: "1.5rem" }}>
                    {activeAdditionalBrief ? (
                      <div style={{ marginBottom: "1rem" }}>
                        <BriefStatusBadge role={viewerRole} status={activeAdditionalBrief.status} />
                      </div>
                    ) : null}
                    {additionalEditorReadOnly && activeAdditionalBrief ? (
                      <AdditionalBriefReadOnly
                        autoTitle={activeAdditionalBrief.title}
                        fields={additionalFields}
                      />
                    ) : (
                      <AdditionalBriefEditor
                        autoTitle={activeAdditionalBrief?.title}
                        fields={additionalFields}
                        onChange={setAdditionalFields}
                        onClose={() => setEditorState({ open: false, mode: "create", type: "ADDITIONAL" })}
                        onSave={() => void handleSaveAdditional()}
                        onSubmit={requestSubmitAdditional}
                        readOnly={additionalEditorReadOnly}
                        saving={saving}
                        showAwaitingClientBanner={showAdditionalAwaitingClientBanner}
                        showSubmit={canSubmitBrief(additionalBriefStatus, isAdminViewer)}
                        submitLabel={submitLabel}
                        submitting={submitting}
                      />
                    )}
                    {additionalEditorReadOnly && activeAdditionalBrief ? (
                      <div className="form-actions" style={{ marginTop: "1rem" }}>
                        <Button
                          onClick={() => setEditorState({ open: false, mode: "create", type: "ADDITIONAL" })}
                          variant="tertiary"
                        >
                          Close
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </SectionPanel>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
