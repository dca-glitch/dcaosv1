import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { createApp } from "../../src/app";

const app = createApp();
const prisma = createPrismaClient();

describe("API integration — client portal (Puriva) boundaries", () => {
  it("requires auth for portal project listing", async () => {
    const response = await request(app).get("/api/v1/client-portal/projects").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for my-client", async () => {
    const response = await request(app).get("/api/v1/client-portal/my-client").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for pending approvals", async () => {
    const response = await request(app).get("/api/v1/client-portal/pending-approvals").expect(401);
    assert.equal(response.body.ok, false);
  });

  it("does not leak sensitive fields in 401 responses", async () => {
    const response = await request(app).get("/api/v1/client-portal/projects");
    const text = JSON.stringify(response.body);
    assert.equal(/passwordHash|sessionTokenHash|storageKey/i.test(text), false);
  });
});

describe("API integration — data isolation (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("protected integration checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("my-client reflects admin client portal access in active tenant", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const userId = login.body.data?.user?.id as string;
    const activeTenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string | undefined;
    assert.ok(token);
    assert.ok(activeTenantId);
    assert.ok(userId);

    const adminAccess = await prisma.clientUserAccess.findFirst({
      where: {
        tenantId: activeTenantId,
        userId,
        isArchived: false
      },
      select: { id: true, clientId: true }
    });

    const response = await request(app)
      .get("/api/v1/client-portal/my-client")
      .set("Authorization", `Bearer ${token}`);

    if (!adminAccess) {
      assert.equal(response.status, 404);
      assert.equal(response.body.error?.code, "CLIENT_PORTAL_ACCESS_NOT_FOUND");
      assert.equal(Object.keys(response.body.data ?? {}).length, 0);
      return;
    }

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.data?.clientId, adminAccess.clientId);
    const client = await prisma.client.findUnique({
      where: { id: response.body.data?.clientId as string },
      select: { tenantId: true }
    });
    assert.equal(client?.tenantId, activeTenantId);
  });

  it("does not return client access from another tenant on my-client", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const userId = login.body.data?.user?.id as string;
    const activeTenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string | undefined;
    assert.ok(token);
    assert.ok(activeTenantId);
    assert.ok(userId);

    const activeAccess = await prisma.clientUserAccess.findFirst({
      where: {
        tenantId: activeTenantId,
        userId,
        isArchived: false
      },
      select: { clientId: true }
    });

    const foreignAccess = await prisma.clientUserAccess.findFirst({
      where: {
        tenantId: { not: activeTenantId },
        isArchived: false
      },
      select: {
        clientId: true,
        tenantId: true
      }
    });

    const response = await request(app)
      .get("/api/v1/client-portal/my-client")
      .set("Authorization", `Bearer ${token}`);

    if (!activeAccess) {
      assert.equal(response.status, 404);
      if (foreignAccess) {
        assert.notEqual(response.body.data?.clientId, foreignAccess.clientId);
      }
      return;
    }

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.data?.clientId, activeAccess.clientId);
    if (foreignAccess) {
      assert.notEqual(response.body.data?.clientId, foreignAccess.clientId);
    }

    const client = await prisma.client.findUnique({
      where: { id: response.body.data?.clientId as string },
      select: { tenantId: true }
    });
    assert.equal(client?.tenantId, activeTenantId);
  });

  it("returns active-tenant client for portal user with client access", async (t) => {
    const portalEmail = process.env.AUTH_SEED_TESTER_EMAIL ?? "puriva@puriva.id";
    const portalPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? password;

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: portalEmail, password: portalPassword });

    if (login.status !== 200) {
      t.skip("portal user unavailable in local seed");
    }

    const token = login.body.data?.session?.token as string;
    const activeTenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string | undefined;
    assert.ok(token);
    assert.ok(activeTenantId);

    const tenantAccess = await prisma.clientUserAccess.findFirst({
      where: {
        tenantId: activeTenantId,
        userId: login.body.data?.user?.id as string,
        isArchived: false
      },
      select: { clientId: true }
    });

    if (!tenantAccess) {
      t.skip("portal user has no client access in active tenant");
    }

    const response = await request(app)
      .get("/api/v1/client-portal/my-client")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(response.body.ok, true);
    assert.equal(response.body.data?.clientId, tenantAccess.clientId);
    assert.ok(typeof response.body.data?.clientName === "string" && response.body.data.clientName.length > 0);
    assert.deepEqual(Object.keys(response.body.data ?? {}).sort(), ["clientId", "clientName"]);

    const client = await prisma.client.findUnique({
      where: { id: response.body.data?.clientId as string },
      select: { tenantId: true }
    });
    assert.equal(client?.tenantId, activeTenantId);
  });

  it("returns tenant-scoped portal projects for authenticated admin", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const response = await request(app)
      .get("/api/v1/client-portal/projects")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(response.body.ok, true);
    assert.ok(Array.isArray(response.body.data?.aiDeliveryProjects));
    assert.equal(/storageKey/i.test(JSON.stringify(response.body)), false);
  });

  it("rejects forged tenant route without membership context", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const response = await request(app)
      .get("/api/v1/client-portal/projects/not-a-real-project-id")
      .set("Authorization", `Bearer ${token}`);

    assert.ok([403, 404].includes(response.status));
  });
});
