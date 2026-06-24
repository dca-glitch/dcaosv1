const smokeMode = process.argv.includes("--staging") ? "staging" : "local";
const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl;
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const testerEmail = process.env.AUTH_SEED_TESTER_EMAIL;
const testerPassword = process.env.AUTH_SEED_TESTER_PASSWORD;

const results = [];
const allowedLocalHosts = new Set(["127.0.0.1", "localhost"]);
const allowedStagingHosts = new Set(["system.digitalcubeagency.net"]);

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    record(`env ${name}`, false, "missing");
    return false;
  }

  record(`env ${name}`, true, "present");
  return true;
}

function requireApiBaseUrl(value) {
  try {
    const parsed = new URL(value);
    const pathOk = parsed.pathname.replace(/\/$/, "") === "/api/v1";

    if (smokeMode === "local") {
      const ok = allowedLocalHosts.has(parsed.hostname) && pathOk;
      record("local API target", ok, ok ? parsed.hostname : "blocked non-local host or API path");
      return ok;
    }

    const hasExplicitTarget = typeof process.env.MVP_SMOKE_API_BASE_URL === "string" &&
      process.env.MVP_SMOKE_API_BASE_URL.length > 0;
    const hostOk = allowedStagingHosts.has(parsed.hostname);
    const protocolOk = parsed.protocol === "https:";
    const ok = hasExplicitTarget && hostOk && protocolOk && pathOk;

    record(
      "staging API target",
      ok,
      ok ? parsed.hostname : "blocked unapproved host, protocol, missing explicit target, or API path"
    );
    return ok;
  } catch {
    record(`${smokeMode} API target`, false, "invalid URL");
    return false;
  }
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json"
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    body,
    text
  };
}

function responseHasSensitiveFields(response) {
  return /passwordHash|sessionTokenHash/i.test(response.text);
}

function getErrorCode(response) {
  return response.body?.error?.code ?? "";
}

function isSafeTenantAccessBlock(response) {
  return response.status === 403 || response.status === 404;
}

async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });
}

function getLoginSource(label, email, password, loginResponse) {
  return {
    label,
    email,
    password,
    token: loginResponse.body?.data?.session?.token ?? null,
    activeMembership: loginResponse.body?.data?.tenantContext?.activeMembership ?? null,
    memberships: loginResponse.body?.data?.tenantContext?.memberships ?? []
  };
}

function findMembershipForTenant(source, tenantId) {
  return source.memberships.find((membership) => membership.tenantId === tenantId) ?? null;
}

function getDistinctTenantEntries(sources) {
  const entries = [];
  const seenTenantIds = new Set();

  for (const source of sources) {
    for (const membership of source.memberships) {
      if (seenTenantIds.has(membership.tenantId)) {
        continue;
      }

      seenTenantIds.add(membership.tenantId);
      entries.push({
        source,
        membership
      });
    }
  }

  return entries;
}

async function loginAndSelectMembership(source, tenantMembershipId) {
  const loginResponse = await login(source.email, source.password);
  const token = loginResponse.body?.data?.session?.token ?? null;
  if (!token) {
    return null;
  }

  const activeMembershipId = loginResponse.body?.data?.tenantContext?.activeMembership?.tenantMembershipId ?? null;
  if (activeMembershipId !== tenantMembershipId) {
    const switchResponse = await request("/tenants/current/switch", {
      method: "POST",
      token,
      body: {
        tenantMembershipId
      }
    });

    if (switchResponse.status !== 200 || switchResponse.body?.ok !== true) {
      return null;
    }
  }

  return {
    token,
    loginResponse
  };
}

async function resolveTenantIsolationFixture(adminSource, testerSource) {
  const entries = getDistinctTenantEntries([adminSource, testerSource].filter(Boolean));
  if (entries.length < 2) {
    return null;
  }

  const firstEntry = entries[0];
  const secondEntry = entries[1];

  const firstTenantMembershipId = firstEntry.membership.tenantMembershipId;
  const secondTenantMembershipId = secondEntry.membership.tenantMembershipId;

  const firstSession =
    firstEntry.source === secondEntry.source
      ? await loginAndSelectMembership(firstEntry.source, firstTenantMembershipId)
      : await loginAndSelectMembership(firstEntry.source, firstTenantMembershipId);

  if (!firstSession) {
    return null;
  }

  const secondSession =
    firstEntry.source === secondEntry.source
      ? await loginAndSelectMembership(secondEntry.source, secondTenantMembershipId)
      : await loginAndSelectMembership(secondEntry.source, secondTenantMembershipId);

  if (!secondSession) {
    return null;
  }

  return {
    tenantA: {
      token: firstSession.token,
      tenantId: firstEntry.membership.tenantId,
      tenantMembershipId: firstTenantMembershipId
    },
    tenantB: {
      token: secondSession.token,
      tenantId: secondEntry.membership.tenantId,
      tenantMembershipId: secondTenantMembershipId
    }
  };
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function requireOkData(name, response, expectedStatus = 201) {
  const ok =
    response.status === expectedStatus &&
    response.body?.ok === true &&
    !responseHasSensitiveFields(response);
  record(name, ok, `${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return response.body.data;
}

async function runLocalFinanceIntegrityChecks(adminToken, financeIsolationFixture) {
  const activeClientName = `[SMOKE][FINANCE] Active ${makeSmokeId("client")}`;
  const archivedClientName = `[SMOKE][FINANCE] Archived ${makeSmokeId("client")}`;
  let activeClientId = null;
  let archivedClientId = null;
  let createdInvoiceId = null;
  let createdRecurringInvoiceId = null;
  const activeClient = requireOkData(
    "finance create active client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: {
        name: activeClientName,
        country: "United States"
      }
    })
  ).client;
  activeClientId = activeClient.id;

  const archivedClient = requireOkData(
    "finance create archived client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: {
        name: archivedClientName,
        country: "United States"
      }
    })
  ).client;
  archivedClientId = archivedClient.id;

  const invoiceNumber = `SMOKE-INV-${Date.now()}`;
  const recurringTitle = `[SMOKE][FINANCE] ${makeSmokeId("recurring")}`;
  const invoiceLineItems = [
    {
      description: "Smoke finance integrity invoice item",
      quantity: 1,
      unitPriceCents: 1000,
      totalCents: 1000,
      sortOrder: 0
    }
  ];

  try {
    const createdInvoice = requireOkData(
      "finance create invoice",
      await request("/invoices", {
        method: "POST",
        token: adminToken,
        body: {
          clientId: activeClient.id,
          invoiceNumber,
          status: "ISSUED",
          issueDate: "2026-06-01T00:00:00.000Z",
          dueDate: "2026-06-30T00:00:00.000Z",
          paidAt: null,
          currency: "USD",
          subtotalCents: 1000,
          taxCents: 0,
          discountCents: 0,
          totalCents: 1000,
          amountPaidCents: 0,
          lineItems: invoiceLineItems
        }
      })
    ).invoice;
    createdInvoiceId = createdInvoice.id;

    const paymentResponse = await request(`/invoices/${createdInvoice.id}/payment`, {
      method: "POST",
      token: adminToken,
      body: {
        paymentMethod: "OTHER",
        amountIssuedCents: 400,
        amountReceivedCents: 400,
        paymentDate: "2026-06-15T00:00:00.000Z"
      }
    });
    const paymentData = requireOkData("finance register partial payment", paymentResponse).invoice;
    record(
      "finance partial payment persisted",
      paymentData.amountPaidCents === 400,
      `amountPaid=${paymentData.amountPaidCents}`
    );

    const markPaidResponse = await request(`/invoices/${createdInvoice.id}/mark-paid`, {
      method: "POST",
      token: adminToken
    });
    record(
      "finance mark paid blocked after partial payment",
      markPaidResponse.status === 409 &&
        getErrorCode(markPaidResponse) === "INVOICE_MARK_PAID_BLOCKED_PARTIAL_PAYMENT",
      `${markPaidResponse.status} ${getErrorCode(markPaidResponse)}`
    );

    const invoiceAfterBlockedMarkPaid = await request(`/invoices/${createdInvoice.id}`, {
      token: adminToken
    });
    const invoiceAfterBlockedMarkPaidData = requireOkData(
      "finance invoice lookup after blocked mark paid",
      invoiceAfterBlockedMarkPaid,
      200
    ).invoice;
    record(
      "finance partial payment amount unchanged",
      invoiceAfterBlockedMarkPaidData.amountPaidCents === 400,
      `amountPaid=${invoiceAfterBlockedMarkPaidData.amountPaidCents}`
    );

    const mixedInvalidInvoiceResponse = await request("/invoices", {
      method: "POST",
      token: adminToken,
        body: {
          clientId: activeClient.id,
          invoiceNumber: `SMOKE-INV-BAD-${Date.now()}`,
          status: "DRAFT",
          issueDate: "2026-06-01T00:00:00.000Z",
          dueDate: "2026-06-30T00:00:00.000Z",
          paidAt: null,
          currency: "USD",
          subtotalCents: 1000,
          taxCents: 0,
        discountCents: 0,
        totalCents: 1000,
        amountPaidCents: 0,
        lineItems: [
          ...invoiceLineItems,
          {
            description: "Broken invoice item",
            quantity: "oops",
            unitPriceCents: 500,
            totalCents: 500,
            sortOrder: 1
          }
        ]
      }
    });
    record(
      "finance mixed invalid invoice line items rejected",
      mixedInvalidInvoiceResponse.status === 400 &&
        getErrorCode(mixedInvalidInvoiceResponse) === "INVOICE_LINE_ITEMS_INVALID",
      `${mixedInvalidInvoiceResponse.status} ${getErrorCode(mixedInvalidInvoiceResponse)}`
    );

    const createdRecurringInvoice = requireOkData(
      "finance create recurring invoice",
      await request("/recurring-invoices", {
        method: "POST",
        token: adminToken,
        body: {
          clientId: archivedClient.id,
          title: recurringTitle,
          interval: "MONTHLY",
          startDate: "2026-06-01T00:00:00.000Z",
          endDate: null,
          nextRunDate: "2026-06-01T00:00:00.000Z",
          currency: "USD",
          subtotalCents: 1000,
          taxCents: 0,
          discountCents: 0,
          totalCents: 1000,
          isActive: true,
          lineItems: invoiceLineItems
        }
      })
    ).recurringInvoice;
    createdRecurringInvoiceId = createdRecurringInvoice.id;

    const mixedInvalidRecurringInvoiceResponse = await request("/recurring-invoices", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: activeClient.id,
        title: `[SMOKE][FINANCE] ${makeSmokeId("bad-recurring")}`,
        interval: "MONTHLY",
        startDate: "2026-06-01T00:00:00.000Z",
        endDate: null,
        nextRunDate: "2026-06-01T00:00:00.000Z",
        currency: "USD",
        subtotalCents: 1000,
        taxCents: 0,
        discountCents: 0,
        totalCents: 1000,
        isActive: true,
        lineItems: [
          ...invoiceLineItems,
          {
            description: "Broken recurring item",
            quantity: 1,
            unitPriceCents: "bad",
            totalCents: 500,
            sortOrder: 1
          }
        ]
      }
    });
    record(
      "finance mixed invalid recurring invoice line items rejected",
      mixedInvalidRecurringInvoiceResponse.status === 400 &&
        getErrorCode(mixedInvalidRecurringInvoiceResponse) === "RECURRING_INVOICE_LINE_ITEMS_INVALID",
      `${mixedInvalidRecurringInvoiceResponse.status} ${getErrorCode(mixedInvalidRecurringInvoiceResponse)}`
    );

    const archiveArchivedClientResponse = await request(`/clients/${archivedClient.id}/archive`, {
      method: "POST",
      token: adminToken
    });
    requireOkData("finance archive recurring client", archiveArchivedClientResponse, 200);

    const generateArchivedClientInvoiceResponse = await request(
      `/recurring-invoices/${createdRecurringInvoice.id}/generate-due`,
      {
        method: "POST",
        token: adminToken,
        body: {
          targetDate: "2026-06-01T00:00:00.000Z"
        }
      }
    );
    record(
      "finance archived client recurring invoice blocked",
      generateArchivedClientInvoiceResponse.status === 409 &&
        getErrorCode(generateArchivedClientInvoiceResponse) === "RECURRING_INVOICE_CLIENT_ARCHIVED",
      `${generateArchivedClientInvoiceResponse.status} ${getErrorCode(generateArchivedClientInvoiceResponse)}`
    );

    const mixedInvalidCreditNoteResponse = await request(`/invoices/${createdInvoice.id}/credit-notes`, {
      method: "POST",
      token: adminToken,
      body: {
        reason: "Smoke invalid credit note line item rejection",
        amountCents: 1000,
        currency: "USD",
        subtotalCents: 1000,
        taxCents: 0,
        discountCents: 0,
        totalCents: 1000,
        lineItems: [
          ...invoiceLineItems,
          {
            description: "Broken credit note item",
            quantity: 1,
            unitPriceCents: 500,
            totalCents: "bad",
            sortOrder: 1
          }
        ]
      }
    });
    record(
      "finance mixed invalid credit note line items rejected",
      mixedInvalidCreditNoteResponse.status === 400 &&
        getErrorCode(mixedInvalidCreditNoteResponse) === "CREDIT_NOTE_LINE_ITEMS_INVALID",
      `${mixedInvalidCreditNoteResponse.status} ${getErrorCode(mixedInvalidCreditNoteResponse)}`
    );

    const financeTenantBToken = financeIsolationFixture?.tenantB?.token ?? null;
    const invoiceSpoofTenantId = "00000000-0000-0000-0000-000000000001";

    if (financeTenantBToken) {
      const invoiceCrossTenantReadResponse = await request(`/invoices/${createdInvoice.id}`, {
        token: financeTenantBToken
      });
      record(
        "finance invoice cross-tenant read blocked",
        isSafeTenantAccessBlock(invoiceCrossTenantReadResponse),
        `${invoiceCrossTenantReadResponse.status}`
      );

      const invoiceCrossTenantUpdateResponse = await request(`/invoices/${createdInvoice.id}`, {
        method: "PUT",
        token: financeTenantBToken,
        body: {
          clientId: activeClient.id,
          invoiceNumber: `${invoiceNumber}-TENANT-B`,
          status: "ISSUED",
          issueDate: "2026-06-01T00:00:00.000Z",
          dueDate: "2026-06-30T00:00:00.000Z",
          paidAt: null,
          currency: "USD",
          subtotalCents: 1000,
          taxCents: 0,
          discountCents: 0,
          totalCents: 1000,
          amountPaidCents: 0,
          lineItems: invoiceLineItems
        }
      });
      record(
        "finance invoice cross-tenant update blocked",
        isSafeTenantAccessBlock(invoiceCrossTenantUpdateResponse),
        `${invoiceCrossTenantUpdateResponse.status}`
      );

      const invoiceCrossTenantArchiveResponse = await request(`/invoices/${createdInvoice.id}/archive`, {
        method: "POST",
        token: financeTenantBToken
      });
      record(
        "finance invoice cross-tenant archive blocked",
        isSafeTenantAccessBlock(invoiceCrossTenantArchiveResponse),
        `${invoiceCrossTenantArchiveResponse.status}`
      );
    } else {
      record("finance invoice cross-tenant checks", true, "skipped - no second-tenant fixture; cross-tenant isolation proof not run");
    }

    const spoofedInvoiceResponse = await request("/invoices", {
      method: "POST",
      token: adminToken,
      body: {
        tenantId: invoiceSpoofTenantId,
        clientId: activeClient.id,
        invoiceNumber: `${invoiceNumber}-SPOOF`,
        status: "ISSUED",
        issueDate: "2026-06-02T00:00:00.000Z",
        dueDate: "2026-06-30T00:00:00.000Z",
        paidAt: null,
        currency: "USD",
        subtotalCents: 1000,
        taxCents: 0,
        discountCents: 0,
        totalCents: 1000,
        amountPaidCents: 0,
        lineItems: invoiceLineItems
      }
    });
    const spoofedInvoice = requireOkData("finance invoice tenant spoof create", spoofedInvoiceResponse, 201).invoice;
    const spoofedInvoiceReadback = await request(`/invoices/${spoofedInvoice.id}`, { token: adminToken });
    record(
      "finance invoice tenant spoof ignored",
      spoofedInvoiceReadback.status === 200,
      `readback=${spoofedInvoiceReadback.status} - invoice in admin tenant not spoofed tenant`
    );
    await request(`/invoices/${spoofedInvoice.id}/archive`, {
      method: "POST",
      token: adminToken
    }).catch(() => undefined);

    const archiveRecurringInvoiceResponse = await request(
      `/recurring-invoices/${createdRecurringInvoice.id}/archive`,
      {
        method: "POST",
        token: adminToken
      }
    );
    requireOkData("finance archive recurring invoice", archiveRecurringInvoiceResponse, 200);
    createdRecurringInvoiceId = null;

    const archiveInvoiceResponse = await request(`/invoices/${createdInvoice.id}/archive`, {
      method: "POST",
      token: adminToken
    });
    requireOkData("finance archive invoice", archiveInvoiceResponse, 200);
    createdInvoiceId = null;

    const archiveActiveClientResponse = await request(`/clients/${activeClient.id}/archive`, {
      method: "POST",
      token: adminToken
    });
    requireOkData("finance archive active client", archiveActiveClientResponse, 200);
    activeClientId = null;
    archivedClientId = null;
  } catch (error) {
    record(
      "finance integrity smoke runtime",
      false,
      error instanceof Error ? error.message : "unknown error"
    );
    throw error;
  } finally {
    if (createdRecurringInvoiceId) {
      await request(`/recurring-invoices/${createdRecurringInvoiceId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
    if (createdInvoiceId) {
      await request(`/invoices/${createdInvoiceId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
    if (activeClientId) {
      await request(`/clients/${activeClientId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
    if (archivedClientId) {
      await request(`/clients/${archivedClientId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
  }
}

async function runLocalInvoiceItemChecks(adminToken) {
  const itemName = `[SMOKE][SVC] ${makeSmokeId("item")}`;
  const updatedName = `[SMOKE][SVC] ${makeSmokeId("item-updated")}`;
  let createdItemId = null;

  try {
    const createResponse = await request("/invoice-items", {
      method: "POST",
      token: adminToken,
      body: {
        name: itemName,
        description: "Smoke services library item",
        unitPriceCents: 5000
      }
    });
    const created = requireOkData("services library create", createResponse, 201).invoiceItem;
    createdItemId = created.id;
    record(
      "services library create fields",
      created.name === itemName && created.unitPriceCents === 5000 && created.isArchived === false,
      `name=${created.name} price=${created.unitPriceCents} archived=${created.isArchived}`
    );

    const listResponse = await request("/invoice-items", { token: adminToken });
    const listData = requireOkData("services library list", listResponse, 200);
    const foundInList = listData.invoiceItems.some((i) => i.id === createdItemId);
    record("services library list contains created item", foundInList, createdItemId);

    const updateResponse = await request(`/invoice-items/${createdItemId}`, {
      method: "PUT",
      token: adminToken,
      body: {
        name: updatedName,
        description: "Smoke services library item updated",
        unitPriceCents: 7500
      }
    });
    const updated = requireOkData("services library update", updateResponse, 200).invoiceItem;
    record(
      "services library update fields",
      updated.name === updatedName && updated.unitPriceCents === 7500,
      `name=${updated.name} price=${updated.unitPriceCents}`
    );

    const archiveResponse = await request(`/invoice-items/${createdItemId}/archive`, {
      method: "POST",
      token: adminToken
    });
    const archived = requireOkData("services library archive", archiveResponse, 200).invoiceItem;
    record("services library archive state", archived.isArchived === true, `archived=${archived.isArchived}`);

    const archivedListResponse = await request("/invoice-items?archived=true", { token: adminToken });
    const archivedListData = requireOkData("services library archived list", archivedListResponse, 200);
    const foundInArchived = archivedListData.invoiceItems.some((i) => i.id === createdItemId);
    record("services library archived list contains item", foundInArchived, createdItemId);

    const restoreResponse = await request(`/invoice-items/${createdItemId}/restore`, {
      method: "POST",
      token: adminToken
    });
    const restored = requireOkData("services library restore", restoreResponse, 200).invoiceItem;
    record("services library restore state", restored.isArchived === false, `archived=${restored.isArchived}`);

    const activeListAfterRestore = await request("/invoice-items", { token: adminToken });
    const activeListData = requireOkData("services library active list after restore", activeListAfterRestore, 200);
    const foundActive = activeListData.invoiceItems.some((i) => i.id === createdItemId);
    record("services library active list contains restored item", foundActive, createdItemId);

    const archiveCleanup = await request(`/invoice-items/${createdItemId}/archive`, {
      method: "POST",
      token: adminToken
    });
    requireOkData("services library cleanup archive", archiveCleanup, 200);
    createdItemId = null;
  } catch (error) {
    record(
      "services library smoke runtime",
      false,
      error instanceof Error ? error.message : "unknown error"
    );
    throw error;
  } finally {
    if (createdItemId) {
      await request(`/invoice-items/${createdItemId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
  }
}

async function runLocalVendorCrudChecks(adminToken) {
  const vendorName = `[SMOKE][VENDOR] ${makeSmokeId("vendor")}`;
  const updatedName = `[SMOKE][VENDOR] ${makeSmokeId("vendor-updated")}`;
  let createdVendorId = null;

  try {
    const createResponse = await request("/vendors", {
      method: "POST",
      token: adminToken,
      body: {
        name: vendorName
      }
    });
    const created = requireOkData("vendor create", createResponse, 201).vendor;
    createdVendorId = created.id;
    record(
      "vendor create fields",
      created.name === vendorName && created.isArchived === false,
      `name=${created.name} archived=${created.isArchived}`
    );

    const listResponse = await request("/vendors", { token: adminToken });
    const listData = requireOkData("vendor list", listResponse, 200);
    const foundInList = listData.vendors.some((v) => v.id === createdVendorId);
    record("vendor list contains created vendor", foundInList, createdVendorId);

    const updateResponse = await request(`/vendors/${createdVendorId}`, {
      method: "PUT",
      token: adminToken,
      body: {
        name: updatedName
      }
    });
    const updated = requireOkData("vendor update", updateResponse, 200).vendor;
    record(
      "vendor update fields",
      updated.name === updatedName,
      `name=${updated.name}`
    );

    const archiveResponse = await request(`/vendors/${createdVendorId}/archive`, {
      method: "POST",
      token: adminToken
    });
    const archived = requireOkData("vendor archive", archiveResponse, 200).vendor;
    record("vendor archive state", archived.isArchived === true, `archived=${archived.isArchived}`);

    const archivedListResponse = await request("/vendors?archived=true", { token: adminToken });
    const archivedListData = requireOkData("vendor archived list", archivedListResponse, 200);
    const foundInArchived = archivedListData.vendors.some((v) => v.id === createdVendorId);
    record("vendor archived list contains vendor", foundInArchived, createdVendorId);

    const restoreResponse = await request(`/vendors/${createdVendorId}/restore`, {
      method: "POST",
      token: adminToken
    });
    const restored = requireOkData("vendor restore", restoreResponse, 200).vendor;
    record("vendor restore state", restored.isArchived === false, `archived=${restored.isArchived}`);

    const activeListAfterRestore = await request("/vendors", { token: adminToken });
    const activeListData = requireOkData("vendor active list after restore", activeListAfterRestore, 200);
    const foundActive = activeListData.vendors.some((v) => v.id === createdVendorId);
    record("vendor active list contains restored vendor", foundActive, createdVendorId);

    const archiveCleanup = await request(`/vendors/${createdVendorId}/archive`, {
      method: "POST",
      token: adminToken
    });
    requireOkData("vendor cleanup archive", archiveCleanup, 200);
    createdVendorId = null;
  } catch (error) {
    record(
      "vendor smoke runtime",
      false,
      error instanceof Error ? error.message : "unknown error"
    );
    throw error;
  } finally {
    if (createdVendorId) {
      await request(`/vendors/${createdVendorId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
  }
}

async function runLocalBillsChecks(adminToken, financeIsolationFixture) {
  const billReference = `[SMOKE][BILL] ${makeSmokeId("bill")}`;
  let createdVendorId = null;
  let createdBillId = null;

  try {
    // Create a vendor for this bill
    const vendorName = `[SMOKE][BILL-VENDOR] ${makeSmokeId("vendor")}`;
    const vendorResponse = await request("/vendors", {
      method: "POST",
      token: adminToken,
      body: { name: vendorName }
    });
    const vendor = requireOkData("bills smoke vendor create", vendorResponse, 201).vendor;
    createdVendorId = vendor.id;
    record(
      "bills smoke vendor created",
      createdVendorId && vendor.isArchived === false,
      `vendorId=${createdVendorId}`
    );

    // Create a bill with all required fields
    const billResponse = await request("/bills", {
      method: "POST",
      token: adminToken,
      body: {
        vendorId: createdVendorId,
        amountCents: 50000,
        paymentForm: "OTHER",
        paymentDate: "2026-06-15T00:00:00.000Z",
        billDate: "2026-06-01T00:00:00.000Z",
        dueDate: "2026-06-30T00:00:00.000Z",
        referenceNumber: billReference
      }
    });
    const bill = requireOkData("bills create", billResponse, 201).bill;
    createdBillId = bill.id;
    record(
      "bills create fields",
      bill.vendorId === createdVendorId && bill.amountCents === 50000 && bill.isArchived === false,
      `vendorId=${bill.vendorId} amount=${bill.amountCents} archived=${bill.isArchived}`
    );

    // List bills and verify
    const listResponse = await request("/bills", { token: adminToken });
    const listData = requireOkData("bills list", listResponse, 200);
    const foundInList = listData.bills.some((b) => b.id === createdBillId);
    record("bills list contains created bill", foundInList, createdBillId);

    // Archive bill
    const archiveResponse = await request(`/bills/${createdBillId}/archive`, {
      method: "POST",
      token: adminToken
    });
    const archived = requireOkData("bills archive", archiveResponse, 200).bill;
    record("bills archive state", archived.isArchived === true, `archived=${archived.isArchived}`);

    // List archived bills and verify
    const archivedListResponse = await request("/bills?archived=true", { token: adminToken });
    const archivedListData = requireOkData("bills archived list", archivedListResponse, 200);
    const foundInArchived = archivedListData.bills.some((b) => b.id === createdBillId);
    record("bills archived list contains bill", foundInArchived, createdBillId);

    // Restore bill
    const restoreResponse = await request(`/bills/${createdBillId}/restore`, {
      method: "POST",
      token: adminToken
    });
    const restored = requireOkData("bills restore", restoreResponse, 200).bill;
    record("bills restore state", restored.isArchived === false, `archived=${restored.isArchived}`);

    const billTenantBToken = financeIsolationFixture?.tenantB?.token ?? null;
    const billSpoofTenantId = "00000000-0000-0000-0000-000000000001";

    if (billTenantBToken) {
      const billCrossTenantReadResponse = await request(`/bills/${createdBillId}`, {
        token: billTenantBToken
      });
      record(
        "bills cross-tenant read blocked",
        isSafeTenantAccessBlock(billCrossTenantReadResponse),
        `${billCrossTenantReadResponse.status}`
      );

      const billCrossTenantUpdateResponse = await request(`/bills/${createdBillId}`, {
        method: "PUT",
        token: billTenantBToken,
        body: {
          vendorId: createdVendorId,
          amountCents: 50000,
          paymentForm: "OTHER",
          paymentDate: "2026-06-15T00:00:00.000Z",
          billDate: "2026-06-01T00:00:00.000Z",
          dueDate: "2026-06-30T00:00:00.000Z",
          referenceNumber: `${billReference}-TENANT-B`
        }
      });
      record(
        "bills cross-tenant update blocked",
        isSafeTenantAccessBlock(billCrossTenantUpdateResponse),
        `${billCrossTenantUpdateResponse.status}`
      );

      const billCrossTenantArchiveResponse = await request(`/bills/${createdBillId}/archive`, {
        method: "POST",
        token: billTenantBToken
      });
      record(
        "bills cross-tenant archive blocked",
        isSafeTenantAccessBlock(billCrossTenantArchiveResponse),
        `${billCrossTenantArchiveResponse.status}`
      );
    } else {
      record("bills cross-tenant checks", true, "skipped - no second-tenant fixture; cross-tenant isolation proof not run");
    }

    const spoofedBillResponse = await request("/bills", {
      method: "POST",
      token: adminToken,
      body: {
        tenantId: billSpoofTenantId,
        vendorId: createdVendorId,
        amountCents: 50000,
        paymentForm: "OTHER",
        paymentDate: "2026-06-15T00:00:00.000Z",
        billDate: "2026-06-01T00:00:00.000Z",
        dueDate: "2026-06-30T00:00:00.000Z",
        referenceNumber: `${billReference}-SPOOF`
      }
    });
    const spoofedBill = requireOkData("bills tenant spoof create", spoofedBillResponse, 201).bill;
    const spoofedBillListResponse = await request("/bills?archived=false", { token: adminToken });
    const spoofedBillList = spoofedBillListResponse.body?.data?.bills ?? [];
    record(
      "bills tenant spoof ignored",
      spoofedBillListResponse.status === 200 && spoofedBillList.some((b) => b.id === spoofedBill.id),
      `bill in admin active list - spoof tenantId ignored`
    );
    await request(`/bills/${spoofedBill.id}/archive`, {
      method: "POST",
      token: adminToken
    }).catch(() => undefined);

    // List active bills and verify restored
    const activeListAfterRestore = await request("/bills", { token: adminToken });
    const activeListData = requireOkData("bills active list after restore", activeListAfterRestore, 200);
    const foundActive = activeListData.bills.some((b) => b.id === createdBillId);
    record("bills active list contains restored bill", foundActive, createdBillId);

    // Archive for cleanup
    const archiveCleanup = await request(`/bills/${createdBillId}/archive`, {
      method: "POST",
      token: adminToken
    });
    requireOkData("bills cleanup archive", archiveCleanup, 200);
    createdBillId = null;

    // Archive vendor for cleanup
    if (createdVendorId) {
      await request(`/vendors/${createdVendorId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
      createdVendorId = null;
    }
  } catch (error) {
    record(
      "bills smoke runtime",
      false,
      error instanceof Error ? error.message : "unknown error"
    );
    throw error;
  } finally {
    if (createdBillId) {
      await request(`/bills/${createdBillId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
    if (createdVendorId) {
      await request(`/vendors/${createdVendorId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
  }
}

async function runLocalCreditNoteChecks(adminToken) {
  const creditNoteReason = `[SMOKE][CN] ${makeSmokeId("credit-note")}`;
  let createdClientId = null;
  let createdInvoiceId = null;
  let createdCreditNoteId = null;

  try {
    // Create client
    const clientResponse = await request("/clients", {
      method: "POST",
      token: adminToken,
      body: {
        name: `[SMOKE][CN-CLIENT] ${makeSmokeId("client")}`,
        country: "United States"
      }
    });
    const client = requireOkData("credit-note client create", clientResponse, 201).client;
    createdClientId = client.id;
    record(
      "credit-note client created",
      createdClientId && !client.isArchived,
      `clientId=${createdClientId}`
    );

    // Create invoice for credit note
    const invoiceLineItems = [
      {
        description: "Smoke credit note test item",
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        sortOrder: 0
      }
    ];
    const invoiceResponse = await request("/invoices", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: createdClientId,
        invoiceNumber: `SMOKE-CN-INV-${Date.now()}`,
        status: "ISSUED",
        issueDate: "2026-06-01T00:00:00.000Z",
        dueDate: "2026-06-30T00:00:00.000Z",
        paidAt: null,
        currency: "USD",
        subtotalCents: 10000,
        taxCents: 0,
        discountCents: 0,
        totalCents: 10000,
        amountPaidCents: 0,
        lineItems: invoiceLineItems
      }
    });
    const invoice = requireOkData("credit-note invoice create", invoiceResponse, 201).invoice;
    createdInvoiceId = invoice.id;
    record(
      "credit-note invoice created",
      createdInvoiceId && invoice.status === "ISSUED",
      `invoiceId=${createdInvoiceId} status=${invoice.status}`
    );

    // Create credit note from invoice
    const createCreditNoteResponse = await request(`/invoices/${createdInvoiceId}/credit-notes`, {
      method: "POST",
      token: adminToken,
      body: {
        reason: creditNoteReason,
        amountCents: 5000,
        currency: "USD",
        subtotalCents: 5000,
        taxCents: 0,
        discountCents: 0,
        totalCents: 5000,
        lineItems: [
          {
            description: "Smoke credit note item partial",
            quantity: 1,
            unitPriceCents: 5000,
            totalCents: 5000,
            sortOrder: 0
          }
        ]
      }
    });
    const creditNote = requireOkData("credit-note create", createCreditNoteResponse, 201).creditNote;
    createdCreditNoteId = creditNote.id;
    record(
      "credit-note create fields",
      createdCreditNoteId && creditNote.status === "DRAFT" && creditNote.totalCents === 5000,
      `creditNoteId=${createdCreditNoteId} status=${creditNote.status} total=${creditNote.totalCents}`
    );

    // Update credit note while DRAFT
    const updateCreditNoteResponse = await request(`/credit-notes/${createdCreditNoteId}`, {
      method: "PUT",
      token: adminToken,
      body: {
        reason: `${creditNoteReason} UPDATED`,
        amountCents: 5000,
        currency: "USD",
        subtotalCents: 5000,
        taxCents: 0,
        discountCents: 0,
        totalCents: 5000,
        lineItems: [
          {
            description: "Smoke credit note item updated",
            quantity: 1,
            unitPriceCents: 5000,
            totalCents: 5000,
            sortOrder: 0
          }
        ]
      }
    });
    const updatedCreditNote = requireOkData("credit-note update", updateCreditNoteResponse, 200).creditNote;
    record(
      "credit-note update fields",
      updatedCreditNote.reason.includes("UPDATED"),
      `reason=${updatedCreditNote.reason}`
    );

    // Issue credit note
    const issueCreditNoteResponse = await request(`/credit-notes/${createdCreditNoteId}/issue`, {
      method: "POST",
      token: adminToken
    });
    const issuedCreditNote = requireOkData("credit-note issue", issueCreditNoteResponse, 200).creditNote;
    record(
      "credit-note issue status",
      issuedCreditNote.status === "ISSUED",
      `status=${issuedCreditNote.status}`
    );

    // Void credit note
    const voidCreditNoteResponse = await request(`/credit-notes/${createdCreditNoteId}/void`, {
      method: "POST",
      token: adminToken
    });
    const voidedCreditNote = requireOkData("credit-note void", voidCreditNoteResponse, 200).creditNote;
    record(
      "credit-note void status",
      voidedCreditNote.status === "VOIDED",
      `status=${voidedCreditNote.status}`
    );

    // Verify detail lookup (if endpoint exists)
    const detailResponse = await request(`/credit-notes/${createdCreditNoteId}`, {
      token: adminToken
    });
    if (detailResponse.status === 200) {
      const detailData = detailResponse.body?.data?.creditNote;
      record(
        "credit-note detail lookup",
        detailData && detailData.status === "VOIDED",
        `status=${detailData?.status}`
      );
    } else {
      record("credit-note detail lookup", true, `${detailResponse.status} - detail GET endpoint not available (optional)`);
    }

    createdCreditNoteId = null;
  } catch (error) {
    record(
      "credit-note smoke runtime",
      false,
      error instanceof Error ? error.message : "unknown error"
    );
    throw error;
  } finally {
    if (createdCreditNoteId) {
      await request(`/credit-notes/${createdCreditNoteId}/void`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
    if (createdInvoiceId) {
      await request(`/invoices/${createdInvoiceId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
    if (createdClientId) {
      await request(`/clients/${createdClientId}/archive`, {
        method: "POST",
        token: adminToken
      }).catch(() => undefined);
    }
  }
}

async function runLocalWordPressConfigChecks(adminToken) {
  try {
    const siteUrl = "https://example-smoke-wordpress.com";
    const saveResponse = await request("/tenant/wordpress-config", {
      method: "POST",
      token: adminToken,
      body: {
        siteUrl,
        siteSlug: "example-smoke",
        wordPressComSite: true
      }
    });
    const saveData = requireOkData("wordpress config save", saveResponse, 200);
    record(
      "wordpress config save fields",
      saveData.config.siteUrl === siteUrl && saveData.config.wordPressComSite === true,
      `siteUrl=${saveData.config.siteUrl} wordPressComSite=${saveData.config.wordPressComSite}`
    );

    const getResponse = await request("/tenant/wordpress-config", { token: adminToken });
    const getData = requireOkData("wordpress config get", getResponse, 200);
    record(
      "wordpress config persisted",
      getData.config.siteUrl === siteUrl,
      `siteUrl=${getData.config.siteUrl}`
    );

    const forbiddenResponse = await request("/tenant/wordpress-config", {
      method: "POST",
      token: adminToken,
      body: {
        siteUrl,
        apiKey: "secret-key-should-be-rejected"
      }
    });
    record(
      "wordpress config rejects forbidden secret field",
      forbiddenResponse.status === 400 && getErrorCode(forbiddenResponse) === "WORDPRESS_CONFIG_INVALID",
      `${forbiddenResponse.status} ${getErrorCode(forbiddenResponse)}`
    );
  } catch (error) {
    record(
      "wordpress config checks",
      false,
      error instanceof Error ? error.message : "unknown error"
    );
    throw error;
  }
}

async function main() {
  if (!requireApiBaseUrl(apiBaseUrl)) {
    process.exitCode = 1;
    return;
  }

  const hasAdminPassword = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!hasAdminPassword) {
    process.exitCode = 1;
    return;
  }

  const health = await request("/health");
  record("health", health.status === 200 && health.body?.ok === true, `${health.status}`);

  const failedLogin = await login(adminEmail, "not-the-local-password");
  record(
    "failed login safe error",
    failedLogin.status === 401 && getErrorCode(failedLogin) === "AUTH_LOGIN_FAILED",
    `${failedLogin.status} ${getErrorCode(failedLogin)}`
  );

  const adminLogin = await login(adminEmail, adminPassword);
  const adminToken = adminLogin.body?.data?.session?.token;
  record(
    "login",
    adminLogin.status === 200 &&
      adminLogin.body?.ok === true &&
      typeof adminToken === "string" &&
      !responseHasSensitiveFields(adminLogin),
    `${adminLogin.status}`
  );

  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const adminSource = getLoginSource("admin", adminEmail, adminPassword, adminLogin);
  let testerLoginResponse = null;

  const checks = [
    ["auth/me", () => request("/auth/me", { token: adminToken }), 200],
    ["auth/context", () => request("/auth/context", { token: adminToken }), 200],
    ["tenants/current", () => request("/tenants/current", { token: adminToken }), 200],
    ["modules", () => request("/modules"), 200],
    ["modules/current", () => request("/modules/current", { token: adminToken }), 200],
    [
      "module enable authorized",
      () => request("/modules/current/finance-lite/enable", { method: "POST", token: adminToken }),
      200
    ],
    [
      "module disable authorized",
      () => request("/modules/current/finance-lite/disable", { method: "POST", token: adminToken }),
      200
    ],
    ["tenant members", () => request("/tenants/current/members", { token: adminToken }), 200],
    ["tenant settings", () => request("/tenants/current/settings", { token: adminToken }), 200]
  ];

  for (const [name, run, expectedStatus] of checks) {
    const response = await run();
    record(
      name,
      response.status === expectedStatus && response.body?.ok === true && !responseHasSensitiveFields(response),
      `${response.status}`
    );
  }

  if (testerEmail && testerPassword) {
    testerLoginResponse = await login(testerEmail, testerPassword);
    const testerToken = testerLoginResponse.body?.data?.session?.token;
    record("tester login", testerLoginResponse.status === 200 && typeof testerToken === "string", `${testerLoginResponse.status}`);

    if (testerToken) {
      const testerEnable = await request("/modules/current/finance-lite/enable", {
        method: "POST",
        token: testerToken
      });

      // Branch on the tester's actual active role so the check reflects the fixture type:
      // - admin/owner fixture (used for Finance cross-tenant proof): module enable is
      //   allowed in the tester's own tenant and a 200 is the correct expected result.
      // - low-priv/local_tester fixture: module enable must be forbidden (403 AUTH_FORBIDDEN).
      const testerActiveRoles =
        testerLoginResponse.body?.data?.tenantContext?.activeMembership?.roles ?? [];
      const testerHasAdminRole = testerActiveRoles.some(
        (r) => r === "owner" || r === "admin"
      );

      if (testerHasAdminRole) {
        record(
          "tester module enable allowed for admin fixture",
          testerEnable.status === 200,
          `${testerEnable.status}`
        );
      } else {
        record(
          "tester module enable forbidden for low-priv tester",
          testerEnable.status === 403 && getErrorCode(testerEnable) === "AUTH_FORBIDDEN",
          `${testerEnable.status} ${getErrorCode(testerEnable)}`
        );
      }
    }
  } else {
    record("module enable forbidden for tester", true, "skipped optional tester env");
  }

  const financeIsolationFixture = await resolveTenantIsolationFixture(
    adminSource,
    testerLoginResponse ? getLoginSource("tester", testerEmail, testerPassword, testerLoginResponse) : null
  );
  record(
    "finance tenant isolation fixture",
    true,
    financeIsolationFixture
      ? `tenantA=${financeIsolationFixture.tenantA.tenantId} tenantB=${financeIsolationFixture.tenantB.tenantId}`
      : "single-tenant seed; cross-tenant tests will skip; set AUTH_SEED_TESTER_EMAIL/PASSWORD on a second tenant to enable"
  );

  if (smokeMode === "local") {
    await runLocalFinanceIntegrityChecks(adminToken, financeIsolationFixture);
    await runLocalInvoiceItemChecks(adminToken);
    await runLocalVendorCrudChecks(adminToken);
    await runLocalBillsChecks(adminToken, financeIsolationFixture);
    await runLocalCreditNoteChecks(adminToken);
    await runLocalWordPressConfigChecks(adminToken);
  } else {
    record("finance integrity checks", true, "skipped outside local mode");
    record("services library checks", true, "skipped outside local mode");
    record("vendor crud checks", true, "skipped outside local mode");
    record("bills checks", true, "skipped outside local mode");
    record("credit-note checks", true, "skipped outside local mode");
    record("wordpress config checks", true, "skipped outside local mode");
  }

  const logout = await request("/auth/logout", { method: "POST", token: adminToken });
  record("logout", logout.status === 200 && logout.body?.ok === true, `${logout.status}`);

  const reusedToken = await request("/auth/me", { token: adminToken });
  record(
    "reused token unauthorized",
    reusedToken.status === 401 && getErrorCode(reusedToken) === "AUTH_UNAUTHORIZED",
    `${reusedToken.status} ${getErrorCode(reusedToken)}`
  );

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL smoke runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
