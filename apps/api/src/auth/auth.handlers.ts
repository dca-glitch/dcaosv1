import type { RequestHandler } from "express";
import { failure, success } from "../utils/responses";
import { getAuthConfig, validateAuthConfigForSkeleton } from "../config";
import { getSessionOptionConfig } from "./session";

export const getAuthStatus: RequestHandler = (_req, res) => {
  const authConfig = getAuthConfig();
  const sessionConfig = getSessionOptionConfig(authConfig);

  res.json(
    success(
      {
        mode: authConfig.mode,
        runtimeEnabled: authConfig.runtimeEnabled,
        authenticated: false,
        providerVendor: authConfig.providerVendor,
        session: {
          cookieName: sessionConfig.cookieName,
          httpOnly: sessionConfig.httpOnly,
          secureInProduction: sessionConfig.secureInProduction,
          sameSite: sessionConfig.sameSite,
          runtimeEnabled: sessionConfig.runtimeEnabled,
          storeType: sessionConfig.storeType
        },
        validation: validateAuthConfigForSkeleton(authConfig)
      },
      {
        phase: "skeleton"
      }
    )
  );
};

function skeletonDisabledResponse(message: string) {
  return failure("AUTH_SKELETON_ONLY", message, {
    mode: "skeleton"
  });
}

export const startAuth: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonDisabledResponse("Auth start is not enabled in this phase."));
};

export const handleAuthCallback: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonDisabledResponse("Auth callback is not enabled in this phase."));
};

export const handleAuthLogout: RequestHandler = (_req, res) => {
  res.status(501).json(skeletonDisabledResponse("Auth logout is not enabled in this phase."));
};
