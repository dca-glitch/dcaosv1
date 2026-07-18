import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWorkspaceAdminLookup } from "./workspace-admin.service";

describe("Workspace-only admin authorization", () => {
  const workspace = { id: "workspace-a", name: "opaque", slug: "opaque" };
  const lookup = createWorkspaceAdminLookup([
    { workspaceId: "workspace-a", userId: "admin", status: "ACTIVE", roles: ["ADMIN"], workspace },
    { workspaceId: "workspace-a", userId: "manager", status: "ACTIVE", roles: ["WORKSPACE_MANAGER"], workspace },
    { workspaceId: "workspace-a", userId: "team", status: "ACTIVE", roles: ["TEAM_MEMBER"], workspace },
    { workspaceId: "workspace-a", userId: "client-manager", status: "ACTIVE", roles: ["CLIENT_MANAGER"], workspace },
    { workspaceId: "workspace-a", userId: "client", status: "ACTIVE", roles: ["CLIENT_USER"], workspace },
    { workspaceId: "workspace-a", userId: "revoked", status: "REMOVED", roles: ["ADMIN"], workspace },
    { workspaceId: "workspace-b", userId: "elsewhere", status: "ACTIVE", roles: ["ADMIN"], workspace: { ...workspace, id: "workspace-b" } }
  ]);
  it("allows only active ADMIN and WORKSPACE_MANAGER in the requested workspace", async () => {
    assert.equal((await lookup({ workspaceId: "workspace-a", userId: "admin" }))?.id, "workspace-a");
    assert.equal((await lookup({ workspaceId: "workspace-a", userId: "manager" }))?.id, "workspace-a");
    for (const userId of ["team", "client-manager", "client", "revoked", "elsewhere", "legacy-owner-without-workspace-membership"]) assert.equal(await lookup({ workspaceId: "workspace-a", userId }), null);
    assert.equal(await lookup({ workspaceId: "workspace-a", userId: "elsewhere" }), null);
  });
});
