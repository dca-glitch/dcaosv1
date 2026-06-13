import type {
  AuthCallbackRequest,
  AuthCallbackResult,
  AuthProviderProfile,
  AuthProviderStatus,
  AuthStartRequest,
  AuthStartResult
} from "./types";

export interface AuthProvider {
  readonly vendor: string;
  getStatus(): AuthProviderStatus;
  startAuth(request: AuthStartRequest): Promise<AuthStartResult> | AuthStartResult;
  handleCallback(request: AuthCallbackRequest): Promise<AuthCallbackResult> | AuthCallbackResult;
  describeProfile(profile: AuthProviderProfile): string;
}

export function createAuthProviderStatus(vendor: string): AuthProviderStatus {
  return {
    mode: "skeleton",
    providerVendor: vendor,
    ready: false,
    message: "Provider runtime is deferred."
  };
}
