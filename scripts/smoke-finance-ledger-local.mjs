const apiBaseUrl = process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    record(`env ${name}`, false, "missing");
    throw new Error(`Missing ${name}`);
  }
  record(`env ${name}`, true, "present");
  return value;
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
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
  return { status: response.status, body };
}

function requireOkData(name, response, expectedStatus = 200) {
  const ok = response.status === expectedStatus && response.body?.ok === true;
  record(name, ok, `status=${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed`);
  }
  return response.body.data;
}

async function loginAsAdmin(password) {
  const loginResponse = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password }
  });
  const loginData = requireOkData("admin login", loginResponse, 200);
  return loginData.session?.token ?? "";
}

async function main() {
  const password = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  const token = await loginAsAdmin(password);

  let clientId = null;
  let projectId = null;
  let invoiceId = null;
  let billId = null;

  try {
    const client = requireOkData(
      "create client",
      await request("/clients", {
        token,
        method: "POST",
        body: {
          name: `Finance Ledger Client ${Date.now()}`,
          email: `finance-ledger-${Date.now()}@example.com`
        }
      }),
      201
    ).client;
    clientId = client.id;

    const project = requireOkData(
      "create project",
      await request("/projects", {
        token,
        method: "POST",
        body: {
          name: `Finance Ledger Project ${Date.now()}`,
          clientId
        }
      }),
      201
    ).project;
    projectId = project.id;

    const vendor = requireOkData(
      "create vendor",
      await request("/vendors", {
        token,
        method: "POST",
        body: { name: `Finance Ledger Vendor ${Date.now()}` }
      }),
      201
    ).vendor;

    const invoice = requireOkData(
      "create invoice",
      await request("/invoices", {
        token,
        method: "POST",
        body: {
          clientId,
          projectId,
          invoiceNumber: `FL-${Date.now()}`,
          status: "ISSUED",
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          paidAt: null,
          currency: "USD",
          subtotalCents: 25000,
          taxCents: 0,
          discountCents: 0,
          totalCents: 25000,
          amountPaidCents: 0,
          lineItems: [
            {
              description: "Ledger integration item",
              quantity: 1,
              unitPriceCents: 25000,
              totalCents: 25000,
              sortOrder: 0
            }
          ]
        }
      }),
      201
    ).invoice;
    invoiceId = invoice.id;

    const bill = requireOkData(
      "create bill",
      await request("/bills", {
        token,
        method: "POST",
        body: {
          vendorId: vendor.id,
          amountCents: 5000,
          paymentForm: "CASH",
          paymentDate: new Date().toISOString(),
          billDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          referenceNumber: `FL-BILL-${Date.now()}`
        }
      }),
      201
    ).bill;
    billId = bill.id;

    const month = new Date().toISOString().slice(0, 7);
    const summary = requireOkData(
      "finance summary",
      await request(`/finance/summary?month=${month}`, { token })
    ).snapshot;
    record(
      "finance summary uses ledger",
      summary.totalRevenue >= 25000 && summary.totalCost >= 5000,
      `revenue=${summary.totalRevenue} cost=${summary.totalCost}`
    );

    const events = requireOkData(
      "finance events",
      await request(`/finance/events?month=${month}`, { token })
    ).events;
    record(
      "invoice event present",
      events.some((event) => event.source === "INVOICE" && event.sourceEntityId === invoiceId),
      invoiceId
    );
    record(
      "bill event present",
      events.some((event) => event.source === "BILL" && event.sourceEntityId === billId),
      billId
    );

    const clientSummary = requireOkData(
      "client finance summary",
      await request(`/finance/client/${clientId}/summary`, { token })
    );
    record("client summary revenue", clientSummary.totalRevenue >= 25000, String(clientSummary.totalRevenue));

    const projectSummary = requireOkData(
      "project finance summary",
      await request(`/finance/project/${projectId}/summary`, { token })
    );
    record("project summary revenue", projectSummary.totalRevenue >= 25000, String(projectSummary.totalRevenue));

    const integrity = requireOkData(
      "finance integrity",
      await request("/finance/integrity", { token })
    );
    record("finance integrity ok", integrity.ok === true, `checks=${integrity.checks.length}`);

    const pdf = requireOkData(
      "finance monthly pdf",
      await request(`/finance/reports/monthly/pdf?month=${month}`, { token, method: "POST" })
    );
    record("finance monthly pdf generated", Boolean(pdf.month), pdf.storageKey ?? "no-storage");
  } finally {
    if (invoiceId) {
      await request(`/invoices/${invoiceId}/archive`, { token, method: "POST" });
    }
    if (billId) {
      await request(`/bills/${billId}/archive`, { token, method: "POST" });
    }
    if (clientId) {
      await request(`/clients/${clientId}/archive`, { token, method: "POST" });
    }
  }

  const failed = results.filter((entry) => !entry.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
