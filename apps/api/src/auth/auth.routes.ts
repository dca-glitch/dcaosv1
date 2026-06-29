import { Router } from "express";
import { getAuthContext, getCurrentUser, logout } from "./auth.controller";
import {
  getAuthStatus,
  handleAuthCallback,
  startAuth
} from "./auth.handlers";
import { login } from "./login.runtime";
import { changePasswordHandler } from "./change-password.controller";
import { createUser } from "./create-user.controller";
import { adminPasswordReset } from "./reset-password.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAnyRole, requireRole, requireTenant } from "../middlewares";

export function createAuthRouter() {
  const router = Router();

  router.get("/status", getAuthStatus);
  router.post("/start", startAuth);
  router.get("/callback", handleAuthCallback);
  router.post("/login", login);
  router.post("/logout", requireAuth, logout);
  router.get("/me", requireAuth, getCurrentUser);
  router.get("/context", requireAuth, requireTenant, requireRole("owner"), getAuthContext);
  router.get("/context/local-tester", requireAuth, requireTenant, requireRole("local_tester"), getAuthContext);
  router.post("/change-password", requireAuth, changePasswordHandler);
  router.post("/create-user", requireAuth, requireTenant, requireAnyRole("owner", "admin"), createUser);
  router.post("/reset-password/:userId", requireAuth, requireTenant, requireAnyRole("owner", "admin"), adminPasswordReset);

  return router;
}
