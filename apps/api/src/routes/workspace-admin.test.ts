import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import request from "supertest";
import { createWorkspaceAdminLookup } from "../workspaces/workspace-admin.service";
import { createWorkspaceAdminRouter } from "./workspace-admin";
const workspace = { id: "target", name: "opaque", slug: "opaque" };
const auth = (userId: string) => (_req: express.Request, res: express.Response, next: express.NextFunction) => { res.locals.authSession = { user: { id: userId } }; next(); };
function app(userId: string, enabled = true) { const api = express(); api.use(createWorkspaceAdminRouter({ enabled: () => enabled, authMiddleware: auth(userId), lookup: createWorkspaceAdminLookup([{ workspaceId: "target", userId: "admin", status: "ACTIVE", roles: ["ADMIN"], workspace }, { workspaceId: "target", userId: "manager", status: "ACTIVE", roles: ["WORKSPACE_MANAGER"], workspace }, { workspaceId: "target", userId: "team", status: "ACTIVE", roles: ["TEAM_MEMBER"], workspace }, { workspaceId: "target", userId: "client-manager", status: "ACTIVE", roles: ["CLIENT_MANAGER"], workspace }, { workspaceId: "target", userId: "client", status: "ACTIVE", roles: ["CLIENT_USER"], workspace }, { workspaceId: "target", userId: "revoked", status: "REMOVED", roles: ["ADMIN"], workspace }, { workspaceId: "other", userId: "other-workspace", status: "ACTIVE", roles: ["ADMIN"], workspace: { ...workspace, id: "other" } }] ) })); return api; }
describe("Workspace admin endpoint", () => {
  it("enforces flag and full deny-by-default matrix without legacy fallback", async () => {
    assert.equal((await request(app("admin")).get("/workspaces/target")).status, 200);
    assert.equal((await request(app("manager")).get("/workspaces/target")).status, 200);
    for (const id of ["team", "client-manager", "client", "revoked", "other-workspace", "legacy-owner-without-workspace-membership"]) assert.equal((await request(app(id)).get("/workspaces/target")).status, 403);
    assert.equal((await request(app("admin", false)).get("/workspaces/target")).status, 404);
  });
});
