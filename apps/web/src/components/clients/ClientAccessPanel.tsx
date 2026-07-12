import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, EmptyState, FilterBar, LoadingState, SectionPanel, Select, StatusBadge, StatusNotice } from "../ui";
import type { ClientAccessTenantUser, ClientAccessUserSummary } from "../../pages/clients/ClientsPage";

type AccessFilter = "active" | "archived" | "all";

type ClientAccessPanelProps = {
  clientId: string;
  clientName: string;
  canEdit: boolean;
  tenantUsers: ClientAccessTenantUser[];
  onLoadUserAccess: (clientId: string, options?: { includeArchived?: boolean }) => Promise<ClientAccessUserSummary[]>;
  onLinkUserAccess: (clientId: string, userId: string) => Promise<boolean>;
  onArchiveUserAccess: (clientId: string, userId: string) => Promise<boolean>;
  tone?: "default" | "compact";
};

function formatAccessDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ClientAccessPanel({
  clientId,
  clientName,
  canEdit,
  tenantUsers,
  onLoadUserAccess,
  onLinkUserAccess,
  onArchiveUserAccess,
  tone = "default"
}: ClientAccessPanelProps) {
  const [accessRecords, setAccessRecords] = useState<ClientAccessUserSummary[]>([]);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("active");
  const [accessUserId, setAccessUserId] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessNotice, setAccessNotice] = useState<string | null>(null);

  const reloadAccess = useCallback(async () => {
    setAccessLoading(true);
    setAccessError(null);
    try {
      const records = await onLoadUserAccess(clientId, { includeArchived: true });
      setAccessRecords(records);
    } catch {
      setAccessError("Access records could not be loaded.");
      setAccessRecords([]);
    } finally {
      setAccessLoading(false);
    }
  }, [clientId, onLoadUserAccess]);

  useEffect(() => {
    void reloadAccess();
  }, [reloadAccess]);

  const filteredRecords = useMemo(
    () =>
      accessRecords.filter((record) => {
        if (accessFilter === "active") {
          return !record.isArchived;
        }
        if (accessFilter === "archived") {
          return record.isArchived;
        }
        return true;
      }),
    [accessFilter, accessRecords]
  );

  const activeUserIds = useMemo(
    () => new Set(accessRecords.filter((record) => !record.isArchived).map((record) => record.user.id)),
    [accessRecords]
  );

  const linkableTenantUsers = useMemo(
    () => tenantUsers.filter((user) => user.status === "ACTIVE" && !activeUserIds.has(user.id)),
    [activeUserIds, tenantUsers]
  );

  async function handleGrantAccess() {
    if (!accessUserId || !canEdit) {
      return;
    }
    setAccessLoading(true);
    setAccessNotice(null);
    setAccessError(null);
    try {
      const ok = await onLinkUserAccess(clientId, accessUserId);
      if (ok) {
        setAccessUserId("");
        setAccessNotice("Portal access granted.");
        await reloadAccess();
      }
    } finally {
      setAccessLoading(false);
    }
  }

  async function handleArchiveAccess(userId: string) {
    if (!canEdit) {
      return;
    }
    setAccessLoading(true);
    setAccessNotice(null);
    setAccessError(null);
    try {
      const ok = await onArchiveUserAccess(clientId, userId);
      if (ok) {
        setAccessNotice("Portal access archived.");
        await reloadAccess();
      }
    } finally {
      setAccessLoading(false);
    }
  }

  async function handleRestoreAccess(userId: string) {
    if (!canEdit) {
      return;
    }
    setAccessLoading(true);
    setAccessNotice(null);
    setAccessError(null);
    try {
      const ok = await onLinkUserAccess(clientId, userId);
      if (ok) {
        setAccessNotice("Portal access restored.");
        await reloadAccess();
      }
    } finally {
      setAccessLoading(false);
    }
  }

  return (
    <SectionPanel
      className="client-access-panel entity-span-2"
      description={`Portal access records for ${clientName}. Client-level only — no project-specific grants in this MVP.`}
      tone={tone}
      title="Client access"
    >
      <p className="muted-text client-access-deferred-note">
        Email invitations, magic links, and password setup are not available in this MVP. Grant portal access only to
        existing active tenant users.
      </p>

      {accessError ? <StatusNotice message={accessError} tone="error" /> : null}
      {accessNotice ? (
        <StatusNotice message={accessNotice} onDismiss={() => setAccessNotice(null)} tone="success" />
      ) : null}

      <FilterBar
        ariaLabel="Access records filter"
        className="client-access-filter"
        onChange={(value) => setAccessFilter(value as AccessFilter)}
        options={[
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" }
        ]}
        value={accessFilter}
      />

      {accessLoading && accessRecords.length === 0 ? (
        <div className="client-access-loading">
          <LoadingState label="Loading access records…" />
        </div>
      ) : null}

      {!accessLoading && filteredRecords.length === 0 ? (
        <EmptyState message="No users linked to this client." title="No access records" variant="inline" />
      ) : null}

      {filteredRecords.length > 0 ? (
        <ul className="dense-access-list client-access-records" aria-label="Access records">
          {filteredRecords.map((access) => (
            <li className="dense-access-row client-access-record" key={access.id}>
              <div className="client-access-record-main">
                <p>
                  <strong>{access.user.name || access.user.email}</strong>
                  <small>{access.user.name ? access.user.email : `User status: ${access.user.status}`}</small>
                </p>
                <div className="client-access-record-meta">
                  <StatusBadge status={access.isArchived ? "archived" : "active"} />
                  <span className="muted-text">Linked {formatAccessDate(access.createdAt)}</span>
                  {access.updatedAt !== access.createdAt ? (
                    <span className="muted-text">Updated {formatAccessDate(access.updatedAt)}</span>
                  ) : null}
                </div>
              </div>
              {canEdit ? (
                <div className="client-access-record-actions">
                  {!access.isArchived ? (
                    <Button
                      disabled={accessLoading}
                      onClick={() => void handleArchiveAccess(access.user.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Archive access
                    </Button>
                  ) : (
                    <Button
                      disabled={accessLoading}
                      onClick={() => void handleRestoreAccess(access.user.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Restore access
                    </Button>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canEdit ? (
        <div className="client-access-grant field-grid">
          <Select
            disabled={accessLoading || linkableTenantUsers.length === 0}
            fullWidth
            label="Link tenant user"
            onChange={(event) => setAccessUserId(event.target.value)}
            options={[
              { value: "", label: "Select active user" },
              ...linkableTenantUsers.map((user) => ({
                value: user.id,
                label: user.name ? `${user.name} (${user.email})` : user.email
              }))
            ]}
            value={accessUserId}
          />
          <div className="client-access-grant-action">
            <span className="muted-text">&nbsp;</span>
            <Button
              disabled={accessLoading || !accessUserId}
              onClick={() => void handleGrantAccess()}
              type="button"
              variant="secondary"
            >
              Link user
            </Button>
          </div>
        </div>
      ) : null}
    </SectionPanel>
  );
}
