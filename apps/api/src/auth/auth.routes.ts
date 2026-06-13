import { Router } from "express";
import { changePassword, getCurrentUser, logout } from "./auth.controller";
import {
  getAuthStatus,
  handleAuthCallback,
  startAuth
} from "./auth.handlers";
import { login } from "./login.runtime";
import { requireAuth } from "../middlewares/auth.middleware";

export function createAuthRouter() {
  const router = Router();

  router.get("/status", getAuthStatus);
  router.post("/start", startAuth);
  router.get("/callback", handleAuthCallback);
  router.post("/login", login);
  router.post("/logout", requireAuth, logout);
  router.get("/me", requireAuth, getCurrentUser);
  router.post("/change-password", changePassword);

  return router;
}
