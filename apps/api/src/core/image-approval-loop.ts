/**
 * Image approval loop state helper (G193).
 *
 * Pure state machine for image candidate lifecycle. No DB, no side effects.
 *
 * States: candidate_generated → admin_approved | admin_rejected →
 * client_approved | client_rejected → replacement_requested → final_accepted
 */

export const IMAGE_APPROVAL_LOOP_VERSION = "IMAGE_APPROVAL_LOOP_V2";

export const IMAGE_APPROVAL_LOOP_STATES = [
  "candidate_generated",
  "admin_approved",
  "admin_rejected",
  "client_approved",
  "client_rejected",
  "replacement_requested",
  "final_accepted"
] as const;

export type ImageApprovalLoopState = (typeof IMAGE_APPROVAL_LOOP_STATES)[number];

export const IMAGE_APPROVAL_LOOP_TRANSITIONS = [
  "generate_candidate",
  "admin_approve",
  "admin_reject",
  "client_approve",
  "client_reject",
  "request_replacement",
  "accept_final",
  "replacement_candidate_ready"
] as const;

export type ImageApprovalLoopTransition = (typeof IMAGE_APPROVAL_LOOP_TRANSITIONS)[number];

export type ImageApprovalLoopTransitionResult =
  | {
      ok: true;
      version: typeof IMAGE_APPROVAL_LOOP_VERSION;
      from: ImageApprovalLoopState;
      to: ImageApprovalLoopState;
      transition: ImageApprovalLoopTransition;
      requiresRejectReason: boolean;
    }
  | {
      ok: false;
      version: typeof IMAGE_APPROVAL_LOOP_VERSION;
      from: ImageApprovalLoopState;
      transition: ImageApprovalLoopTransition;
      error: string;
    };

type TransitionRule = {
  to: ImageApprovalLoopState;
  requiresRejectReason: boolean;
};

const TRANSITION_TABLE: Record<
  ImageApprovalLoopState,
  Partial<Record<ImageApprovalLoopTransition, TransitionRule>>
> = {
  candidate_generated: {
    admin_approve: { to: "admin_approved", requiresRejectReason: false },
    admin_reject: { to: "admin_rejected", requiresRejectReason: true },
    request_replacement: { to: "replacement_requested", requiresRejectReason: true }
  },
  admin_approved: {
    client_approve: { to: "client_approved", requiresRejectReason: false },
    client_reject: { to: "client_rejected", requiresRejectReason: true },
    admin_reject: { to: "admin_rejected", requiresRejectReason: true }
  },
  admin_rejected: {
    request_replacement: { to: "replacement_requested", requiresRejectReason: true },
    replacement_candidate_ready: { to: "candidate_generated", requiresRejectReason: false }
  },
  client_approved: {
    accept_final: { to: "final_accepted", requiresRejectReason: false },
    client_reject: { to: "client_rejected", requiresRejectReason: true }
  },
  client_rejected: {
    request_replacement: { to: "replacement_requested", requiresRejectReason: true }
  },
  replacement_requested: {
    replacement_candidate_ready: { to: "candidate_generated", requiresRejectReason: false }
  },
  final_accepted: {
    // Terminal for WordPress inclusion readiness; no further transitions.
  }
};

export function isImageApprovalLoopState(value: string): value is ImageApprovalLoopState {
  return (IMAGE_APPROVAL_LOOP_STATES as readonly string[]).includes(value);
}

export function isTerminalImageApprovalState(state: ImageApprovalLoopState): boolean {
  return state === "final_accepted";
}

/**
 * Applies a pure approval-loop transition. Returns the next state or an error
 * when the transition is not allowed from the current state.
 */
export function applyImageApprovalLoopTransition(
  from: ImageApprovalLoopState,
  transition: ImageApprovalLoopTransition
): ImageApprovalLoopTransitionResult {
  if (transition === "generate_candidate" && from === "candidate_generated") {
    return {
      ok: true,
      version: IMAGE_APPROVAL_LOOP_VERSION,
      from,
      to: "candidate_generated",
      transition,
      requiresRejectReason: false
    };
  }

  const rule = TRANSITION_TABLE[from]?.[transition];
  if (!rule) {
    return {
      ok: false,
      version: IMAGE_APPROVAL_LOOP_VERSION,
      from,
      transition,
      error: `Transition "${transition}" is not allowed from state "${from}".`
    };
  }

  return {
    ok: true,
    version: IMAGE_APPROVAL_LOOP_VERSION,
    from,
    to: rule.to,
    transition,
    requiresRejectReason: rule.requiresRejectReason
  };
}

/**
 * Lists legal transitions from a given state (for UI/docs; pure).
 */
export function listImageApprovalLoopTransitions(
  from: ImageApprovalLoopState
): ImageApprovalLoopTransition[] {
  const rules = TRANSITION_TABLE[from] ?? {};
  const transitions = Object.keys(rules) as ImageApprovalLoopTransition[];
  if (from === "candidate_generated") {
    return ["generate_candidate", ...transitions];
  }
  return transitions;
}

export type ImageFinalAcceptedInvariantInput = {
  approvalState: ImageApprovalLoopState;
  hasAltText: boolean;
  altTextAllowed?: boolean;
  complianceAllowed?: boolean;
};

export type ImageFinalAcceptedInvariantResult =
  | {
      ok: true;
      version: typeof IMAGE_APPROVAL_LOOP_VERSION;
      state: "final_accepted";
      checks: string[];
    }
  | {
      ok: false;
      version: typeof IMAGE_APPROVAL_LOOP_VERSION;
      state: ImageApprovalLoopState;
      errors: string[];
      checks: string[];
    };

/**
 * G321 — Final-accepted invariant: only `final_accepted` with reviewed alt text
 * (and optional compliance/alt policy passes) may advance to WordPress readiness.
 */
export function assertImageFinalAcceptedInvariant(
  input: ImageFinalAcceptedInvariantInput
): ImageFinalAcceptedInvariantResult {
  const errors: string[] = [];
  const checks: string[] = [];

  if (input.approvalState !== "final_accepted") {
    errors.push(`Expected final_accepted; got "${input.approvalState}".`);
    checks.push("REJECT:not_final_accepted");
  } else {
    checks.push("ALLOW:final_accepted");
  }

  if (!input.hasAltText) {
    errors.push("Reviewed alt text is required for final_accepted assets.");
    checks.push("REJECT:missing_alt_text");
  } else {
    checks.push("ALLOW:alt_text_present");
  }

  if (input.altTextAllowed === false) {
    errors.push("Alt text policy must allow the reviewed alt text.");
    checks.push("REJECT:alt_text_policy");
  } else if (input.altTextAllowed === true) {
    checks.push("ALLOW:alt_text_policy");
  }

  if (input.complianceAllowed === false) {
    errors.push("Image compliance policy must allow the final asset concept.");
    checks.push("REJECT:compliance_policy");
  } else if (input.complianceAllowed === true) {
    checks.push("ALLOW:compliance_policy");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      version: IMAGE_APPROVAL_LOOP_VERSION,
      state: input.approvalState,
      errors,
      checks
    };
  }

  return {
    ok: true,
    version: IMAGE_APPROVAL_LOOP_VERSION,
    state: "final_accepted",
    checks: [...checks, "INVARIANT:final_accepted_ready"]
  };
}

export type ImageApprovalHappyPathStep = {
  from: ImageApprovalLoopState;
  transition: ImageApprovalLoopTransition;
  to: ImageApprovalLoopState;
};

/**
 * G558 — Canonical happy-path steps to `final_accepted` (docs/tests only).
 */
export function listImageApprovalHappyPathToFinal(): ImageApprovalHappyPathStep[] {
  return [
    { from: "candidate_generated", transition: "admin_approve", to: "admin_approved" },
    { from: "admin_approved", transition: "client_approve", to: "client_approved" },
    { from: "client_approved", transition: "accept_final", to: "final_accepted" }
  ];
}

/**
 * G558 — Walks the happy path and returns the terminal state or first failure.
 */
export function walkImageApprovalHappyPathToFinal(): {
  ok: boolean;
  state: ImageApprovalLoopState;
  steps: ImageApprovalLoopTransitionResult[];
} {
  const steps: ImageApprovalLoopTransitionResult[] = [];
  let state: ImageApprovalLoopState = "candidate_generated";

  for (const step of listImageApprovalHappyPathToFinal()) {
    const result = applyImageApprovalLoopTransition(state, step.transition);
    steps.push(result);
    if (!result.ok) {
      return { ok: false, state, steps };
    }
    state = result.to;
  }

  return { ok: true, state, steps };
}
