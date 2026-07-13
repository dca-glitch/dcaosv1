import { type FormEvent, useState } from "react";
import { Modal } from "../../components/ui";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  ModalActions,
  PageHeader,
  SectionPanel,
  StatusBadge,
} from "../../components/ui";
import { SettingsSubNav } from "../settings/SettingsSubNav";
import { settingsAccessModeLabel } from "../settings/settings-display";
import "../settings/settings.css";

export type CompanyProfileSummary = {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  country: string | null;
  registrationNumber: string | null;
  billingAddress: string | null;
  paymentInstructions: string | null;
  logoUrl: string | null;
  isActive: boolean;
  currency: string;
  invoiceTemplateKey: string;
  invoicePrefix: string | null;
  creditNotePrefix: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyProfileFormValues = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  country: string;
  registrationNumber: string;
  billingAddress: string;
  paymentInstructions: string;
  logoUrl: string;
  currency: string;
  invoiceTemplateKey: string;
  invoicePrefix: string;
  creditNotePrefix: string;
};

type CompanyProfilePageProps = {
  companyProfile: CompanyProfileSummary | null;
  canEdit: boolean;
  error: string | null;
  loading: boolean;
  onSave: (values: CompanyProfileFormValues) => Promise<boolean>;
};

const emptyForm = (): CompanyProfileFormValues => ({
  name: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  taxId: "",
  country: "",
  registrationNumber: "",
  billingAddress: "",
  paymentInstructions: "",
  logoUrl: "",
  currency: "USD",
  invoiceTemplateKey: "classic",
  invoicePrefix: "DCA-INV",
  creditNotePrefix: "DCA-CN"
});

export function CompanyProfilePage({ companyProfile, canEdit, error, loading, onSave }: CompanyProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<CompanyProfileFormValues>(
    companyProfile
      ? {
          name: companyProfile.name,
          legalName: companyProfile.legalName ?? "",
          email: companyProfile.email ?? "",
          phone: companyProfile.phone ?? "",
          website: companyProfile.website ?? "",
          taxId: companyProfile.taxId ?? "",
          country: companyProfile.country ?? "",
          registrationNumber: companyProfile.registrationNumber ?? "",
          billingAddress: companyProfile.billingAddress ?? "",
          paymentInstructions: companyProfile.paymentInstructions ?? "",
          logoUrl: companyProfile.logoUrl ?? "",
          currency: companyProfile.currency ?? "USD",
          invoiceTemplateKey: companyProfile.invoiceTemplateKey ?? "classic",
          invoicePrefix: companyProfile.invoicePrefix ?? "DCA-INV",
          creditNotePrefix: companyProfile.creditNotePrefix ?? "DCA-CN"
        }
      : emptyForm()
  );

  const submitLabel = companyProfile ? "Update company profile" : "Create company profile";

  function closeEditor() {
    setIsEditing(false);
  }

  function openEditor() {
    setDraft(
      companyProfile
        ? {
            name: companyProfile.name,
            legalName: companyProfile.legalName ?? "",
            email: companyProfile.email ?? "",
            phone: companyProfile.phone ?? "",
            website: companyProfile.website ?? "",
            taxId: companyProfile.taxId ?? "",
            country: companyProfile.country ?? "",
            registrationNumber: companyProfile.registrationNumber ?? "",
            billingAddress: companyProfile.billingAddress ?? "",
            paymentInstructions: companyProfile.paymentInstructions ?? "",
            logoUrl: companyProfile.logoUrl ?? "",
            currency: companyProfile.currency ?? "USD",
            invoiceTemplateKey: companyProfile.invoiceTemplateKey ?? "classic",
            invoicePrefix: companyProfile.invoicePrefix ?? "DCA-INV",
            creditNotePrefix: companyProfile.creditNotePrefix ?? "DCA-CN"
          }
        : emptyForm()
    );
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

  if (loading) {
    return <LoadingState label="Loading company profile" />;
  }

  if (error) {
    return <ErrorState message={error} title="Company profile unavailable" />;
  }

  const profileStatusLabel = companyProfile ? (companyProfile.isActive ? "Active" : "Inactive") : "Not set";

  return (
    <section className="view-section settings-admin" aria-labelledby="company-profile-title" data-density="compact">
      <PageHeader
        actions={
          canEdit ? (
            <Button onClick={openEditor} type="button">
              {companyProfile ? "Edit Profile" : "Create Profile"}
            </Button>
          ) : undefined
        }
        description="Issuer details for finance documents. Invite and password reset remain deferred."
        eyebrow="Settings"
        title="Company Profile"
        titleId="company-profile-title"
      />
      <SettingsSubNav activeView="company-profile" />
      <div className="summary-grid metric-grid company-profile-shell-metrics" aria-label="Company profile shell metrics">
        <MetricCard
          accent={companyProfile?.isActive ? "success" : "warning"}
          helper={companyProfile?.name ?? "Create profile to enable finance issuer details"}
          label="Profile status"
          metricKey="company-profile-status"
          value={profileStatusLabel}
        />
        <MetricCard
          accent="cyan"
          helper={companyProfile?.currency ?? "USD default"}
          label="Default currency"
          metricKey="company-profile-currency"
          value={companyProfile?.currency ?? "—"}
        />
        <MetricCard
          accent={canEdit ? "success" : "violet"}
          helper={canEdit ? "Admins can update issuer details" : "View-only for this membership"}
          label="Access mode"
          metricKey="company-profile-access-mode"
          value={settingsAccessModeLabel(canEdit)}
        />
      </div>
      {!canEdit ? (
        <p className="muted-text">Read-only view. Company profile edits require an owner or admin tenant role.</p>
      ) : null}
      {!companyProfile ? (
        <EmptyState
          message="No company profile exists yet. Create the single active profile when you're ready."
          title="Profile not set"
        />
      ) : (
        <SectionPanel
          tone="compact"
          description="Single active company profile used as issuer on invoices and credit notes. API keys are never shown on this page."
          title="Profile details"
        >
        <article className="entity-card entity-card-wide">
          <div className="entity-card-header">
            <div>
              <StatusBadge status={companyProfile.isActive ? "Active" : "Inactive"} />
              <h2>{companyProfile.name}</h2>
            </div>
            {canEdit ? (
              <Button onClick={openEditor} type="button" variant="secondary">
                Edit
              </Button>
            ) : null}
          </div>
          <div className="entity-field-grid">
            <div>
              <span>Legal name</span>
              <strong>{companyProfile.legalName || "Not set"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{companyProfile.email || "Not set"}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{companyProfile.phone || "Not set"}</strong>
            </div>
            <div>
              <span>Website</span>
              <strong>{companyProfile.website || "Not set"}</strong>
            </div>
            <div>
              <span>Tax ID</span>
              <strong>{companyProfile.taxId || "Not set"}</strong>
            </div>
            <div>
              <span>Country</span>
              <strong>{companyProfile.country || "Not set"}</strong>
            </div>
            <div>
              <span>Registration number</span>
              <strong>{companyProfile.registrationNumber || "Not set"}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>{companyProfile.currency || "USD"}</strong>
            </div>
            <div>
              <span>Invoice template</span>
              <strong>{companyProfile.invoiceTemplateKey || "classic"}</strong>
            </div>
            <div>
              <span>Invoice prefix</span>
              <strong>{companyProfile.invoicePrefix || "DCA-INV"}</strong>
            </div>
            <div>
              <span>Credit note prefix</span>
              <strong>{companyProfile.creditNotePrefix || "DCA-CN"}</strong>
            </div>
            <div className="entity-span-2">
              <span>Billing address</span>
              <strong>{companyProfile.billingAddress || "Not set"}</strong>
            </div>
            <div className="entity-span-2">
              <span>Payment instructions</span>
              <strong>{companyProfile.paymentInstructions || "Not set"}</strong>
            </div>
            <div className="entity-span-2">
              <span>Logo URL</span>
              <strong>{companyProfile.logoUrl || "Not set"}</strong>
            </div>
          </div>
        </article>
        </SectionPanel>
      )}

      <SectionPanel
        tone="compact"
        description="WordPress site URLs and application passwords are configured per client in Client Hub → Publication targets."
        title="WordPress publication (moved)"
      >
        <p className="muted-text">
          Tenant-level WordPress config is deprecated. Open a client record and use <strong>Open hub</strong> to manage
          publication targets, encrypted credentials, analytics profile, and publication logs.
        </p>
        <a className="secondary-action" href="#/clients">
          Go to Clients
        </a>
      </SectionPanel>

      {isEditing ? (
        <Modal isOpen onClose={closeEditor} title={companyProfile ? "Edit Company Profile" : "Create Company Profile"}>
          <form className="entity-form" onSubmit={handleSubmit}>
            <p className="muted-text">Used as issuer details on finance documents. Visible only to admin team unless used on generated documents.</p>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
            <div className="field-grid">
              <label>
                Company name - Required
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Trading or public-facing company name"
                  required
                  value={draft.name}
                />
                <span className="muted-text">Used as the primary company identity inside the admin workspace.</span>
              </label>
              <label>
                Legal name - Optional
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, legalName: event.target.value }))}
                  placeholder="Registered company name"
                  value={draft.legalName}
                />
                <span className="muted-text">Used as issuer details on finance documents.</span>
              </label>
              <label>
                Email - Optional
                <input
                  maxLength={320}
                  onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Company inbox for billing or operations"
                  type="email"
                  value={draft.email}
                />
                <span className="muted-text">Visible only to admin team unless used on generated documents.</span>
              </label>
              <label>
                Phone - Optional
                <input
                  maxLength={60}
                  onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Primary company phone number"
                  value={draft.phone}
                />
                <span className="muted-text">Visible only to admin team unless used on generated documents.</span>
              </label>
              <label>
                Website - Optional
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                  placeholder="Public company website"
                  type="url"
                  value={draft.website}
                />
                <span className="muted-text">Used for admin reference and company identity.</span>
              </label>
              <label>
                Tax/VAT ID - Optional
                <input
                  maxLength={100}
                  onChange={(event) => setDraft((current) => ({ ...current, taxId: event.target.value }))}
                  placeholder="Company tax registration number"
                  value={draft.taxId}
                />
                <span className="muted-text">Used as issuer details on finance documents.</span>
              </label>
              <label>
                Registration number - Optional
                <input
                  maxLength={100}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, registrationNumber: event.target.value }))
                  }
                  placeholder="Official company registration number"
                  value={draft.registrationNumber}
                />
                <span className="muted-text">Visible only to admin team unless used on generated documents.</span>
              </label>
              <label>
                Country - Optional
                <select
                  onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))}
                  value={draft.country}
                >
                  <option value="">Country used for registration or billing context</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Poland">Poland</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Australia">Australia</option>
                </select>
                <span className="muted-text">Visible only to admin team unless used on generated documents.</span>
              </label>
              <label className="field-span-2">
                Billing address - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, billingAddress: event.target.value }))}
                  placeholder="Official billing or registration address"
                  rows={4}
                  value={draft.billingAddress}
                />
                <span className="muted-text">Used as issuer details on finance documents.</span>
              </label>
              <label>
                Default currency - Required
                <input
                  maxLength={3}
                  onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                  placeholder="Three-letter currency code, for example USD"
                  required
                  value={draft.currency}
                />
                <span className="muted-text">Changing this may affect future generated documents only.</span>
              </label>
              <label>
                Invoice template - Required
                <input
                  maxLength={120}
                  onChange={(event) => setDraft((current) => ({ ...current, invoiceTemplateKey: event.target.value }))}
                  placeholder="Template key used for generated invoice layout"
                  required
                  value={draft.invoiceTemplateKey}
                />
                <span className="muted-text">Changing this may affect future generated documents only.</span>
              </label>
              <label>
                Invoice prefix - Required
                <input
                  maxLength={120}
                  onChange={(event) => setDraft((current) => ({ ...current, invoicePrefix: event.target.value }))}
                  placeholder="Prefix used before generated invoice numbers"
                  required
                  value={draft.invoicePrefix}
                />
                <span className="muted-text">Changing this may affect future generated documents only.</span>
              </label>
              <label>
                Credit note prefix - Required
                <input
                  maxLength={120}
                  onChange={(event) => setDraft((current) => ({ ...current, creditNotePrefix: event.target.value }))}
                  placeholder="Prefix used before generated credit note numbers"
                  required
                  value={draft.creditNotePrefix}
                />
                <span className="muted-text">Changing this may affect future generated documents only.</span>
              </label>
              <label className="field-span-2">
                Payment instructions - Optional
                <textarea
                  maxLength={4000}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, paymentInstructions: event.target.value }))
                  }
                  placeholder="Bank details or payment note shown on future invoices"
                  rows={4}
                  value={draft.paymentInstructions}
                />
                <span className="muted-text">Used as issuer details on finance documents.</span>
              </label>
              <label className="field-span-2">
                Logo URL - Optional
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
                  placeholder="Public logo file URL used on generated documents"
                  type="url"
                  value={draft.logoUrl}
                />
                <span className="muted-text">Visible only to admin team unless used on generated documents.</span>
              </label>
            </div>
            <ModalActions disabled={saving} label={submitLabel} onCancel={closeEditor} saving={saving} />
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
