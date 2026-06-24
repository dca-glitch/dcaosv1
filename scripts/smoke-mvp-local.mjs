const smokeMode = process.argv.includes("--staging") ? "staging" : "local";
const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl;
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL;
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

async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });
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

async function runLocalFinanceIntegrityChecks(adminToken) {
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

async function main() {
  if (!requireApiBaseUrl(apiBaseUrl)) {
    process.exitCode = 1;
    return;
  }

  const hasAdminEmail = requireEnv("AUTH_SEED_TEST_EMAIL", adminEmail);
  const hasAdminPassword = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!hasAdminEmail || !hasAdminPassword) {
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
    const testerLogin = await login(testerEmail, testerPassword);
    const testerToken = testerLogin.body?.data?.session?.token;
    record("tester login", testerLogin.status === 200 && typeof testerToken === "string", `${testerLogin.status}`);

    if (testerToken) {
      const testerEnable = await request("/modules/current/finance-lite/enable", {
        method: "POST",
        token: testerToken
      });
      record(
        "module enable forbidden for tester",
        testerEnable.status === 403 && getErrorCode(testerEnable) === "AUTH_FORBIDDEN",
        `${testerEnable.status} ${getErrorCode(testerEnable)}`
      );
    }
  } else {
    record("module enable forbidden for tester", true, "skipped optional tester env");
  }

  if (smokeMode === "local") {
    await runLocalFinanceIntegrityChecks(adminToken);
    await runLocalInvoiceItemChecks(adminToken);
  } else {
    record("finance integrity checks", true, "skipped outside local mode");
    record("services library checks", true, "skipped outside local mode");
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
