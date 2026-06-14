import { type FormEvent, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";

export type CompanyProfileSummary = {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  billingAddress: string | null;
  paymentInstructions: string | null;
  logoUrl: string | null;
  isActive: boolean;
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
  registrationNumber: string;
  billingAddress: string;
  paymentInstructions: string;
  logoUrl: string;
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
  registrationNumber: "",
  billingAddress: "",
  paymentInstructions: "",
  logoUrl: ""
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
          registrationNumber: companyProfile.registrationNumber ?? "",
          billingAddress: companyProfile.billingAddress ?? "",
          paymentInstructions: companyProfile.paymentInstructions ?? "",
          logoUrl: companyProfile.logoUrl ?? ""
        }
      : emptyForm()
  );

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
            registrationNumber: companyProfile.registrationNumber ?? "",
            billingAddress: companyProfile.billingAddress ?? "",
            paymentInstructions: companyProfile.paymentInstructions ?? "",
            logoUrl: companyProfile.logoUrl ?? ""
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
        setIsEditing(false);
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

  return (
    <section className="view-section" aria-labelledby="company-profile-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 id="company-profile-title">Company Profile</h1>
        </div>
        {canEdit ? (
          <button className="primary-action" onClick={openEditor} type="button">
            {companyProfile ? "Edit Profile" : "Create Profile"}
          </button>
        ) : null}
      </div>
      {!companyProfile ? (
        <EmptyState
          message="No company profile exists yet. Create the single active profile when you're ready."
          title="Profile not set"
        />
      ) : (
        <article className="entity-card entity-card-wide">
          <div className="entity-card-header">
            <div>
              <span className={`entity-pill entity-pill-${companyProfile.isActive ? "active" : "archived"}`}>
                {companyProfile.isActive ? "Active" : "Inactive"}
              </span>
              <h2>{companyProfile.name}</h2>
            </div>
            {canEdit ? (
              <button className="secondary-action" onClick={openEditor} type="button">
                Edit
              </button>
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
              <span>Registration number</span>
              <strong>{companyProfile.registrationNumber || "Not set"}</strong>
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
      )}

      {isEditing ? (
        <Modal onClose={() => setIsEditing(false)} title="Edit Company Profile">
          <form className="entity-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Name
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={draft.name}
                />
              </label>
              <label>
                Legal name
                <input
                  maxLength={255}
                  onChange={(event) => setDraft((current) => ({ ...current, legalName: event.target.value }))}
                  value={draft.legalName}
                />
              </label>
              <label>
                Email
                <input
                  maxLength={320}
                  onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  value={draft.email}
                />
              </label>
              <label>
                Phone
                <input
                  maxLength={60}
                  onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  value={draft.phone}
                />
              </label>
              <label>
                Website
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                  type="url"
                  value={draft.website}
                />
              </label>
              <label>
                Tax ID
                <input
                  maxLength={100}
                  onChange={(event) => setDraft((current) => ({ ...current, taxId: event.target.value }))}
                  value={draft.taxId}
                />
              </label>
              <label>
                Registration number
                <input
                  maxLength={100}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, registrationNumber: event.target.value }))
                  }
                  value={draft.registrationNumber}
                />
              </label>
              <label className="field-span-2">
                Billing address
                <textarea
                  maxLength={4000}
                  onChange={(event) => setDraft((current) => ({ ...current, billingAddress: event.target.value }))}
                  rows={4}
                  value={draft.billingAddress}
                />
              </label>
              <label className="field-span-2">
                Payment instructions
                <textarea
                  maxLength={4000}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, paymentInstructions: event.target.value }))
                  }
                  rows={4}
                  value={draft.paymentInstructions}
                />
              </label>
              <label className="field-span-2">
                Logo URL
                <input
                  maxLength={2048}
                  onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
                  type="url"
                  value={draft.logoUrl}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-action" disabled={saving} onClick={() => setIsEditing(false)} type="button">
                Cancel
              </button>
              <button className="primary-action" disabled={saving} type="submit">
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
