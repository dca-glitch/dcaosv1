import { Router } from "express";
import {
  getAuthStatus,
  handleAuthCallback,
  handleAuthLogout,
  startAuth
} from "./auth.handlers";

export function createAuthRouter() {
  const router = Router();

  router.get("/status", getAuthStatus);
  router.post("/start", startAuth);
  router.get("/callback", handleAuthCallback);
  router.post("/logout", handleAuthLogout);

  return router;
}
