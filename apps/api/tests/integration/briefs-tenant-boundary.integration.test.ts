import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { createApp } from "../../src/app";

const app = createApp();
const prisma = createPrismaClient();

describe("API integration — legacy /briefs tenant boundary (SEC-B1)", () => {
  it("requires auth for brief listing", async () => {
    const response = await request(app)
      .get("/api/v1/briefs?clientId=00000000-0000-4000-8000-000000000001")
      .expect(401);

    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for brief by id", async () => {
    const response = await request(app)
      .get("/api/v1/briefs/00000000-0000-4000-8000-000000000001")
      .expect(401);

    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for admin brief listing", async () => {
    const response = await request(app).get("/api/v1/briefs/admin").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — legacy /briefs tenant boundary (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("protected SEC-B1 regression checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("denies cross-tenant brief list by foreign clientId for admin", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const activeTenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string | undefined;
    assert.ok(token);
    assert.ok(activeTenantId);

    const foreignClient = await prisma.client.findFirst({
      where: { tenantId: { not: activeTenantId } },
      select: { id: true, tenantId: true }
    });

    if (!foreignClient) {
      return;
    }

    const response = await request(app)
      .get(`/api/v1/briefs?clientId=${encodeURIComponent(foreignClient.id)}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.ok, false);
  });

  it("denies cross-tenant brief read by id for admin", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const activeTenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string | undefined;
    assert.ok(token);
    assert.ok(activeTenantId);

    const foreignClient = await prisma.client.findFirst({
      where: { tenantId: { not: activeTenantId } },
      select: { id: true }
    });

    if (!foreignClient) {
      return;
    }

    const foreignBrief = await prisma.clientMonthlyBrief.findFirst({
      where: { clientId: foreignClient.id },
      select: { id: true, clientId: true }
    });

    if (!foreignBrief) {
      return;
    }

    const response = await request(app)
      .get(`/api/v1/briefs/${foreignBrief.id}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.ok, false);
  });

  it("allows same-tenant brief admin listing", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const activeTenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string | undefined;
    assert.ok(token);
    assert.ok(activeTenantId);

    const response = await request(app)
      .get("/api/v1/briefs/admin")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(response.body.ok, true);
    assert.ok(Array.isArray(response.body.data));

    for (const brief of response.body.data as Array<{ clientId?: string }>) {
      if (!brief.clientId) {
        continue;
      }
      const client = await prisma.client.findUnique({
        where: { id: brief.clientId },
        select: { tenantId: true }
      });
      assert.equal(client?.tenantId, activeTenantId);
    }
  });

  it("does not leak storageKey in brief responses", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    const token = login.body.data?.session?.token as string;
    const response = await request(app)
      .get("/api/v1/briefs/admin")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(/storageKey/i.test(JSON.stringify(response.body)), false);
  });
});
