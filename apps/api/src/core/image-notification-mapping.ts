/**
 * Image approval-loop → notification event mapping (G194).
 *
 * Maps image state changes to shared notification taxonomy event types.
 * G228 integration added the four image-loop events to notification-events.ts.
 */

import type { ImageApprovalLoopState, ImageApprovalLoopTransition } from "./image-approval-loop";

export const IMAGE_NOTIFICATION_MAPPING_VERSION = "IMAGE_NOTIFICATION_MAPPING_V1";

/**
 * Event type strings aligned with packages/shared notification taxonomy.
 */
export const IMAGE_NOTIFICATION_EXISTING_EVENTS = {
  image_set_ready_for_client_review: "image_set_ready_for_client_review",
  client_image_approved: "client_image_approved",
  client_image_rejected: "client_image_rejected",
  admin_action_required: "admin_action_required",
  image_candidate_generated: "image_candidate_generated",
  image_admin_rejected: "image_admin_rejected",
  image_replacement_requested: "image_replacement_requested",
  image_final_accepted: "image_final_accepted"
} as const;

/** @deprecated All G194 events are now in the shared taxonomy; kept for test compatibility. */
export const IMAGE_NOTIFICATION_NEEDED_EVENTS = {
  image_candidate_generated: "image_candidate_generated",
  image_admin_rejected: "image_admin_rejected",
  image_replacement_requested: "image_replacement_requested",
  image_final_accepted: "image_final_accepted"
} as const;

export type ImageNotificationEventType =
  | (typeof IMAGE_NOTIFICATION_EXISTING_EVENTS)[keyof typeof IMAGE_NOTIFICATION_EXISTING_EVENTS]
  | (typeof IMAGE_NOTIFICATION_NEEDED_EVENTS)[keyof typeof IMAGE_NOTIFICATION_NEEDED_EVENTS];

export type ImageNotificationAudience = "admin" | "client";

export type ImageStateNotificationMapping = {
  version: typeof IMAGE_NOTIFICATION_MAPPING_VERSION;
  fromState: ImageApprovalLoopState;
  toState: ImageApprovalLoopState;
  transition: ImageApprovalLoopTransition;
  eventType: ImageNotificationEventType;
  audiences: ImageNotificationAudience[];
  taxonomyStatus: "existing" | "needed";
  notify: boolean;
};

type MappingRule = {
  eventType: ImageNotificationEventType;
  audiences: ImageNotificationAudience[];
  taxonomyStatus: "existing" | "needed";
  notify: boolean;
};

/**
 * Maps (from → to) state pairs produced by approval-loop transitions to
 * notification events. Pure; no side effects.
 */
const STATE_CHANGE_NOTIFICATION_MAP: Partial<
  Record<ImageApprovalLoopState, Partial<Record<ImageApprovalLoopState, MappingRule>>>
> = {
  candidate_generated: {
    admin_approved: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_set_ready_for_client_review,
      audiences: ["client"],
      taxonomyStatus: "existing",
      notify: true
    },
    admin_rejected: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_admin_rejected,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    },
    replacement_requested: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_replacement_requested,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    }
  },
  admin_approved: {
    client_approved: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.client_image_approved,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    },
    client_rejected: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.client_image_rejected,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    },
    admin_rejected: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_admin_rejected,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    }
  },
  admin_rejected: {
    replacement_requested: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_replacement_requested,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    },
    candidate_generated: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_candidate_generated,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    }
  },
  client_approved: {
    final_accepted: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_final_accepted,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    },
    client_rejected: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.client_image_rejected,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    }
  },
  client_rejected: {
    replacement_requested: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_replacement_requested,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    }
  },
  replacement_requested: {
    candidate_generated: {
      eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.image_candidate_generated,
      audiences: ["admin"],
      taxonomyStatus: "existing",
      notify: true
    }
  }
};

/**
 * Maps an image approval-loop state change to a notification event descriptor.
 * Returns null when the transition has no notification (e.g. no-op generate).
 */
export function mapImageStateChangeToNotification(input: {
  fromState: ImageApprovalLoopState;
  toState: ImageApprovalLoopState;
  transition: ImageApprovalLoopTransition;
}): ImageStateNotificationMapping | null {
  if (input.fromState === input.toState) {
    return null;
  }

  const rule = STATE_CHANGE_NOTIFICATION_MAP[input.fromState]?.[input.toState];
  if (!rule) {
    // Fallback: admin action required for unmapped notify-worthy changes
    if (input.toState === "admin_rejected" || input.toState === "replacement_requested") {
      return {
        version: IMAGE_NOTIFICATION_MAPPING_VERSION,
        fromState: input.fromState,
        toState: input.toState,
        transition: input.transition,
        eventType: IMAGE_NOTIFICATION_EXISTING_EVENTS.admin_action_required,
        audiences: ["admin"],
        taxonomyStatus: "existing",
        notify: true
      };
    }
    return null;
  }

  return {
    version: IMAGE_NOTIFICATION_MAPPING_VERSION,
    fromState: input.fromState,
    toState: input.toState,
    transition: input.transition,
    eventType: rule.eventType,
    audiences: [...rule.audiences],
    taxonomyStatus: rule.taxonomyStatus,
    notify: rule.notify
  };
}

/**
 * Convenience: after a successful approval-loop transition, resolve notification.
 */
export function mapImageApprovalTransitionToNotification(input: {
  from: ImageApprovalLoopState;
  to: ImageApprovalLoopState;
  transition: ImageApprovalLoopTransition;
}): ImageStateNotificationMapping | null {
  return mapImageStateChangeToNotification({
    fromState: input.from,
    toState: input.to,
    transition: input.transition
  });
}

/** Lists event names that exist in shared taxonomy and are used by this mapper. */
export function listExistingImageNotificationEvents(): string[] {
  return Object.values(IMAGE_NOTIFICATION_EXISTING_EVENTS);
}

/** @deprecated G228: all mapped events are in shared taxonomy; returns empty. */
export function listNeededImageNotificationEvents(): string[] {
  return [];
}
