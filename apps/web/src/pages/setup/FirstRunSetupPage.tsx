import { type FormEvent, useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  Input,
  PageHeader,
  SectionPanel,
  Select,
  Textarea
} from "../../components/ui";
import type { CompanyProfileFormValues } from "../company-profile/CompanyProfilePage";
import type { ClientFormValues } from "../clients/ClientsPage";

type FirstRunSetupPageProps = {
  needsCompanyProfile: boolean;
  needsFirstClient: boolean;
  companySaving: boolean;
  clientSaving: boolean;
  error: string | null;
  onSaveCompany: (values: CompanyProfileFormValues) => Promise<boolean>;
  onSaveClient: (values: ClientFormValues) => Promise<boolean>;
  onFinished: () => void;
};

const emptyCompany = (): CompanyProfileFormValues => ({
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

const emptyClient = (): ClientFormValues => ({
  name: "",
  email: "",
  website: "",
  contactPerson: "",
  billingAddress: "",
  taxId: "",
  country: "",
  clientKind: "AGENCY_CLIENT",
  legalEntityName: "",
  accountGroupName: "",
  migrationStatus: "ACTIVE",
  operatingPackKey: ""
});

export function FirstRunSetupPage({
  needsCompanyProfile,
  needsFirstClient,
  companySaving,
  clientSaving,
  error,
  onSaveCompany,
  onSaveClient,
  onFinished
}: FirstRunSetupPageProps) {
  const initialStep = needsCompanyProfile ? 1 : 2;
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [companyDraft, setCompanyDraft] = useState(emptyCompany);
  const [clientDraft, setClientDraft] = useState(emptyClient);
  const [localError, setLocalError] = useState<string | null>(null);

  const stepLabel = useMemo(() => {
    if (needsCompanyProfile && needsFirstClient) {
      return step === 1 ? "Step 1 of 2 — Company settings" : "Step 2 of 2 — Add your first client";
    }
    if (needsCompanyProfile) {
      return "Step 1 of 1 — Company settings";
    }
    return "Step 1 of 1 — Add your first client";
  }, [needsCompanyProfile, needsFirstClient, step]);

  async function handleCompanySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    if (!companyDraft.name.trim()) {
      setLocalError("Company name is required.");
      return;
    }
    const ok = await onSaveCompany(companyDraft);
    if (!ok) {
      return;
    }
    if (needsFirstClient) {
      setStep(2);
      return;
    }
    onFinished();
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    if (!clientDraft.name.trim()) {
      setLocalError("Client name is required.");
      return;
    }
    const ok = await onSaveClient(clientDraft);
    if (!ok) {
      return;
    }
    onFinished();
  }

  return (
    <div className="page-stack">
      <PageHeader
        description="Configure your agency once, then add the first real client. No sample data is created automatically."
        eyebrow="First-run setup"
        title="Welcome to DCA OS Lite"
        titleId="first-run-setup-title"
      />

      <SectionPanel title={stepLabel}>
        <p className="muted-text">
          Password authentication stays required. External providers remain disabled until you enable them later.
        </p>
        {error || localError ? (
          <EmptyState
            message={error ?? localError ?? ""}
            title="Could not continue"
            variant="inline"
          />
        ) : null}

        {step === 1 && needsCompanyProfile ? (
          <form className="form-grid" onSubmit={(event) => void handleCompanySubmit(event)}>
            <label>
              Company name
              <Input
                autoComplete="organization"
                name="companyName"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, name: event.target.value }))}
                required
                value={companyDraft.name}
              />
            </label>
            <label>
              Legal name
              <Input
                name="legalName"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, legalName: event.target.value }))}
                value={companyDraft.legalName}
              />
            </label>
            <label>
              Business email
              <Input
                autoComplete="email"
                name="companyEmail"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                value={companyDraft.email}
              />
            </label>
            <label>
              Website
              <Input
                name="website"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, website: event.target.value }))}
                value={companyDraft.website}
              />
            </label>
            <label>
              Country / region
              <Input
                name="country"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, country: event.target.value }))}
                value={companyDraft.country}
              />
            </label>
            <label>
              Default currency
              <Input
                name="currency"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                value={companyDraft.currency}
              />
            </label>
            <label>
              Phone
              <Input
                name="phone"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, phone: event.target.value }))}
                value={companyDraft.phone}
              />
            </label>
            <label>
              Logo URL (optional)
              <Input
                name="logoUrl"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, logoUrl: event.target.value }))}
                value={companyDraft.logoUrl}
              />
            </label>
            <label className="form-grid-span">
              Billing address
              <Textarea
                name="billingAddress"
                onChange={(event) => setCompanyDraft((prev) => ({ ...prev, billingAddress: event.target.value }))}
                rows={3}
                value={companyDraft.billingAddress}
              />
            </label>
            <div className="form-actions">
              <Button disabled={companySaving} type="submit" variant="primary">
                {companySaving ? "Saving…" : needsFirstClient ? "Save and continue" : "Save and finish"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === 2 || (!needsCompanyProfile && needsFirstClient) ? (
          <form className="form-grid" onSubmit={(event) => void handleClientSubmit(event)}>
            <p className="muted-text">
              Add your first real client. Leave Operating Pack blank unless you intentionally select a pack from the registry.
            </p>
            <label>
              Client name
              <Input
                name="clientName"
                onChange={(event) => setClientDraft((prev) => ({ ...prev, name: event.target.value }))}
                required
                value={clientDraft.name}
              />
            </label>
            <label>
              Website / domain
              <Input
                name="clientWebsite"
                onChange={(event) => setClientDraft((prev) => ({ ...prev, website: event.target.value }))}
                value={clientDraft.website}
              />
            </label>
            <label>
              Contact name
              <Input
                name="contactPerson"
                onChange={(event) => setClientDraft((prev) => ({ ...prev, contactPerson: event.target.value }))}
                value={clientDraft.contactPerson}
              />
            </label>
            <label>
              Contact email
              <Input
                name="clientEmail"
                onChange={(event) => setClientDraft((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                value={clientDraft.email}
              />
            </label>
            <label>
              Country / locale
              <Input
                name="clientCountry"
                onChange={(event) => setClientDraft((prev) => ({ ...prev, country: event.target.value }))}
                value={clientDraft.country}
              />
            </label>
            <label>
              Client status
              <Select
                fullWidth
                label="Client status"
                name="migrationStatus"
                onChange={(event) =>
                  setClientDraft((prev) => ({
                    ...prev,
                    migrationStatus: event.target.value as ClientFormValues["migrationStatus"]
                  }))
                }
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "PLANNED_LICENSEE_TENANT", label: "Planned licensee tenant" },
                  { value: "MIGRATED", label: "Migrated" }
                ]}
                value={clientDraft.migrationStatus}
              />
            </label>
            <label>
              Operating Pack (optional)
              <Select
                fullWidth
                helperText="Leave unbound unless you intentionally select a registry pack."
                label="Operating pack"
                name="operatingPackKey"
                onChange={(event) =>
                  setClientDraft((prev) => ({
                    ...prev,
                    operatingPackKey: event.target.value as ClientFormValues["operatingPackKey"]
                  }))
                }
                options={[
                  { value: "", label: "None (unbound)" },
                  { value: "PURIVA_OPERATING_PACK_V1", label: "PURIVA_OPERATING_PACK_V1" }
                ]}
                value={clientDraft.operatingPackKey}
              />
            </label>
            <div className="form-actions">
              {needsCompanyProfile ? (
                <Button
                  disabled={clientSaving}
                  onClick={() => setStep(1)}
                  type="button"
                  variant="secondary"
                >
                  Back
                </Button>
              ) : null}
              <Button disabled={clientSaving} type="submit" variant="primary">
                {clientSaving ? "Creating…" : "Create client and open dashboard"}
              </Button>
            </div>
          </form>
        ) : null}
      </SectionPanel>
    </div>
  );
}
