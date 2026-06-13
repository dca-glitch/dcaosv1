import { Router } from "express";
import { changePassword, getCurrentUser, logout } from "./auth.controller";
import {
  getAuthStatus,
  handleAuthCallback,
  startAuth
} from "./auth.handlers";
import { login } from "./login.runtime";

export function createAuthRouter() {
  const router = Router();

  router.get("/status", getAuthStatus);
  router.post("/start", startAuth);
  router.get("/callback", handleAuthCallback);
  router.post("/login", login);
  router.post("/logout", logout);
  router.get("/me", getCurrentUser);
  router.post("/change-password", changePassword);

  return router;
}
