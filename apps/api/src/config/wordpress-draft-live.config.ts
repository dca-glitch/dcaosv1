/**
 * WordPress dedicated live-draft authorization (separate from generic publish).
 * Both flags default false; exact string "true" required.
 * Does not authorize generic publish / WORDPRESS_PUBLISH_ENABLED paths.
 */

export const WORDPRESS_DRAFT_LIVE_ENV_KEYS = {
  enabled: "WORDPRESS_DRAFT_LIVE_ENABLED",
  liveCallsAllowed: "WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED"
} as const;

export type WordPressDraftLiveAuthorizationSnapshot = {
  enabled: boolean;
  liveCallsAllowed: boolean;
  authorized: boolean;
  reason: string;
};

function isExactTrue(value: string | undefined): boolean {
  return (value ?? "").trim() === "true";
}

export function evaluateWordPressDraftLiveAuthorization(
  env: NodeJS.ProcessEnv = process.env
): WordPressDraftLiveAuthorizationSnapshot {
  const enabled = isExactTrue(env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled]);
  const liveCallsAllowed = isExactTrue(env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed]);

  if (!enabled && !liveCallsAllowed) {
    return {
      enabled: false,
      liveCallsAllowed: false,
      authorized: false,
      reason: "WordPress live draft is disabled (both authorization flags false)."
    };
  }
  if (!enabled) {
    return {
      enabled: false,
      liveCallsAllowed,
      authorized: false,
      reason: "WORDPRESS_DRAFT_LIVE_ENABLED is not true."
    };
  }
  if (!liveCallsAllowed) {
    return {
      enabled,
      liveCallsAllowed: false,
      authorized: false,
      reason: "WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED is not true."
    };
  }
  return {
    enabled: true,
    liveCallsAllowed: true,
    authorized: true,
    reason: "WordPress live draft temporarily authorized."
  };
}

export function isWordPressDraftLiveAuthorized(env: NodeJS.ProcessEnv = process.env): boolean {
  return evaluateWordPressDraftLiveAuthorization(env).authorized;
}
