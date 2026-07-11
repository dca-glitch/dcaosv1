import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { createApp } from "../../src/app";

const app = createApp();
const prisma = createPrismaClient();

describe("API integration — in-app notification inbox", () => {
  it("requires auth for admin inbox", async () => {
    const response = await request(app).get("/api/v1/notifications/inbox").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for client inbox", async () => {
    const response = await request(app).get("/api/v1/client-portal/notifications").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — in-app notification inbox (authenticated, optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
  const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL ?? "puriva@puriva.id";
  const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? password;

  if (!password) {
    it("notification inbox authenticated checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("admin can list and mark own inbox notification as read", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email: adminEmail, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    const tenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string;
    const userId = login.body.data?.user?.id as string;
    assert.ok(token);
    assert.ok(tenantId);
    assert.ok(userId);

    const created = await prisma.inAppNotification.create({
      data: {
        tenantId,
        recipientUserId: userId,
        recipientRole: "admin",
        eventType: "admin_alert_after_client_action",
        severity: "action_required",
        title: "Client requested changes",
        relatedEntityType: "aiDeliveryDeliverable",
        relatedEntityId: `test-deliverable-${Date.now()}`,
        actionKey: `admin-inbox-${Date.now()}`,
        idempotencyKey: `admin-inbox-${Date.now()}`
      },
      select: { id: true }
    });

    try {
      const listResponse = await request(app)
        .get("/api/v1/notifications/inbox?limit=10")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      assert.equal(listResponse.body.ok, true);
      assert.ok(Array.isArray(listResponse.body.data?.notifications));
      assert.ok(
        (listResponse.body.data.notifications as Array<{ id: string }>).some((row) => row.id === created.id)
      );

      const markReadResponse = await request(app)
        .post(`/api/v1/notifications/inbox/${created.id}/read`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      assert.equal(markReadResponse.body.ok, true);

      const unreadResponse = await request(app)
        .get("/api/v1/notifications/inbox/unread")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      assert.equal(unreadResponse.body.ok, true);
      assert.ok(typeof unreadResponse.body.data?.unreadCount === "number");
      assert.ok(
        !(unreadResponse.body.data.notifications as Array<{ id: string }>).some((row) => row.id === created.id)
      );
    } finally {
      await prisma.inAppNotification.deleteMany({
        where: { id: created.id }
      });
    }
  });

  it("client can list and mark own client-portal notification as read", async (t) => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: clientEmail, password: clientPassword });

    if (login.status !== 200) {
      t.skip("client portal user unavailable in local seed");
      return;
    }

    const token = login.body.data?.session?.token as string;
    const tenantId = login.body.data?.tenantContext?.activeMembership?.tenantId as string;
    const userId = login.body.data?.user?.id as string;
    assert.ok(token);
    assert.ok(tenantId);
    assert.ok(userId);

    const access = await prisma.clientUserAccess.findFirst({
      where: { tenantId, userId, isArchived: false },
      select: { clientId: true }
    });
    if (!access) {
      t.skip("client portal user has no active client access in active tenant");
      return;
    }

    const created = await prisma.inAppNotification.create({
      data: {
        tenantId,
        recipientUserId: userId,
        recipientRole: "client",
        clientId: access.clientId,
        eventType: "client_approval_needed",
        severity: "action_required",
        title: "A deliverable is ready for review",
        relatedEntityType: "aiDeliveryDeliverable",
        relatedEntityId: `test-client-deliverable-${Date.now()}`,
        actionKey: `client-inbox-${Date.now()}`,
        idempotencyKey: `client-inbox-${Date.now()}`
      },
      select: { id: true }
    });

    try {
      const listResponse = await request(app)
        .get("/api/v1/client-portal/notifications?limit=10")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      assert.equal(listResponse.body.ok, true);
      assert.ok(Array.isArray(listResponse.body.data?.notifications));
      assert.ok(
        (listResponse.body.data.notifications as Array<{ id: string }>).some((row) => row.id === created.id)
      );

      const markReadResponse = await request(app)
        .post(`/api/v1/client-portal/notifications/${created.id}/read`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      assert.equal(markReadResponse.body.ok, true);

      const unreadResponse = await request(app)
        .get("/api/v1/client-portal/notifications/unread")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      assert.equal(unreadResponse.body.ok, true);
      assert.ok(typeof unreadResponse.body.data?.unreadCount === "number");
      assert.ok(
        !(unreadResponse.body.data.notifications as Array<{ id: string }>).some((row) => row.id === created.id)
      );
    } finally {
      await prisma.inAppNotification.deleteMany({
        where: { id: created.id }
      });
    }
  });
});
