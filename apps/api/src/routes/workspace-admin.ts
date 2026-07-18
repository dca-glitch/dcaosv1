import { Router } from "express";
import type { RequestHandler } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { isWorkspaceLocalEndpointEnabled } from "../config/workspace-local-endpoint.config";
import { forbiddenFailure, failure, success, unauthorizedFailure } from "../utils/responses";
import { resolveWorkspaceAdminMetadata, type WorkspaceMembershipLookup } from "../workspaces/workspace-admin.service";
import type { AuthSessionLocals } from "../auth/types";

export function createWorkspaceAdminRouter(options: { enabled?: () => boolean; lookup?: WorkspaceMembershipLookup; authMiddleware?: RequestHandler } = {}) {
  const router = Router(); const enabled = options.enabled ?? isWorkspaceLocalEndpointEnabled; const lookup = options.lookup ?? resolveWorkspaceAdminMetadata;
  router.get("/workspaces/:workspaceId", options.authMiddleware ?? requireAuth, async (req, res) => {
    if (!enabled()) return void res.status(404).json(failure("NOT_FOUND", "Route was not found."));
    const session = (res.locals as AuthSessionLocals).authSession;
    if (!session) return void res.status(401).json(unauthorizedFailure());
    const workspaceId = typeof req.params.workspaceId === "string" ? req.params.workspaceId.trim() : "";
    if (!workspaceId) return void res.status(403).json(forbiddenFailure());
    const workspace = await lookup({ workspaceId, userId: session.user.id });
    if (!workspace) return void res.status(403).json(forbiddenFailure());
    res.json(success({ workspace }, { scope: "workspace-admin-metadata", authorization: "workspace-only" }));
  });
  return router;
}
