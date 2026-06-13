import type {
  SessionPersistenceBoundaryResult,
  SessionPersistenceInput,
  SessionPersistenceRecord
} from "./types";

function notImplemented(message: string): SessionPersistenceBoundaryResult {
  return {
    ok: false,
    code: "SESSION_DB_RUNTIME_BLOCKED",
    message
  };
}

export interface AuthService {
  login(): SessionPersistenceBoundaryResult;
  logout(): SessionPersistenceBoundaryResult;
  getCurrentUser(): SessionPersistenceBoundaryResult;
  changePassword(): SessionPersistenceBoundaryResult;
  createSession(input: SessionPersistenceInput): SessionPersistenceBoundaryResult | SessionPersistenceRecord;
}

export function createAuthService(): AuthService {
  return {
    login: () => notImplemented("Auth login is not enabled until the session and user runtime gates are approved."),
    logout: () => notImplemented("Auth logout is not enabled until the session and user runtime gates are approved."),
    getCurrentUser: () =>
      notImplemented("Auth current-user lookup is not enabled until the auth runtime gate is approved."),
    changePassword: () =>
      notImplemented("Auth password change is not enabled until the auth runtime gate is approved."),
    createSession: (_input) =>
      notImplemented("Session persistence is not enabled until the database/runtime gate is approved.")
  };
}
