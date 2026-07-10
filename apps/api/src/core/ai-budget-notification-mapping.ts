/**
 * AI budget threshold/cap notification mapping (G389–G408).
 * Maps budget signals onto existing notification business events.
 * Does not edit Lane 2 notification-events definitions.
 */

export const AI_BUDGET_NOTIFICATION_MAPPING_VERSION = "AI_BUDGET_NOTIFICATION_MAPPING_V1";

/** Existing NotificationBusinessEvent keys (Lane 2) — do not invent new keys here. */
export type AiBudgetExistingBusinessEventKey =
  | "BUDGET_THRESHOLD_WARNING"
  | "BUDGET_CAP_BLOCKED"
  | "BUDGET_CAP_REACHED";

/** Existing NotificationEventType keys (Lane 2). */
export type AiBudgetExistingNotificationEventType =
  | "budget_threshold_warning"
  | "budget_cap_blocked"
  | "budget_cap_reached";

/** Existing AI notification event types (shared ai-notification-events). */
export type AiBudgetExistingAiNotificationEventType = "budget_warning" | "budget_cap_reached";

export type AiBudgetNotificationSignal =
  | "threshold_warning"
  | "cap_blocked"
  | "cap_reached"
  | "kill_switch_active";

export interface AiBudgetNotificationMappingRow {
  signal: AiBudgetNotificationSignal;
  businessEventKey: AiBudgetExistingBusinessEventKey;
  notificationEventType: AiBudgetExistingNotificationEventType;
  aiNotificationEventType: AiBudgetExistingAiNotificationEventType;
  severityHint: "warning" | "blocked" | "critical";
  sendDefault: "no_send_until_owner_gate";
  notes: string;
}

export interface AiBudgetNotificationMappingContract {
  version: typeof AI_BUDGET_NOTIFICATION_MAPPING_VERSION;
  lane2Ownership: "notification-events_owned_elsewhere";
  proposedNewEventKeys: readonly string[];
  mappings: readonly AiBudgetNotificationMappingRow[];
}

const MAPPINGS: readonly AiBudgetNotificationMappingRow[] = [
  {
    signal: "threshold_warning",
    businessEventKey: "BUDGET_THRESHOLD_WARNING",
    notificationEventType: "budget_threshold_warning",
    aiNotificationEventType: "budget_warning",
    severityHint: "warning",
    sendDefault: "no_send_until_owner_gate",
    notes: "Warn when remaining monthly AI budget approaches the Puriva cap; no-send default."
  },
  {
    signal: "cap_blocked",
    businessEventKey: "BUDGET_CAP_BLOCKED",
    notificationEventType: "budget_cap_blocked",
    aiNotificationEventType: "budget_warning",
    severityHint: "blocked",
    sendDefault: "no_send_until_owner_gate",
    notes: "Emitted when budget guard blocks a projected over-cap workflow."
  },
  {
    signal: "cap_reached",
    businessEventKey: "BUDGET_CAP_REACHED",
    notificationEventType: "budget_cap_reached",
    aiNotificationEventType: "budget_cap_reached",
    severityHint: "critical",
    sendDefault: "no_send_until_owner_gate",
    notes: "Emitted when spentThisPeriodUsd reaches the monthly cap."
  },
  {
    signal: "kill_switch_active",
    businessEventKey: "BUDGET_CAP_REACHED",
    notificationEventType: "budget_cap_reached",
    aiNotificationEventType: "budget_cap_reached",
    severityHint: "critical",
    sendDefault: "no_send_until_owner_gate",
    notes: "Kill switch maps to existing cap-reached events; no new Lane 2 key required."
  }
];

export function getAiBudgetNotificationMappingContract(): AiBudgetNotificationMappingContract {
  return {
    version: AI_BUDGET_NOTIFICATION_MAPPING_VERSION,
    lane2Ownership: "notification-events_owned_elsewhere",
    proposedNewEventKeys: [],
    mappings: MAPPINGS
  };
}

export function mapAiBudgetSignalToExistingNotification(
  signal: AiBudgetNotificationSignal
): AiBudgetNotificationMappingRow {
  const row = MAPPINGS.find((entry) => entry.signal === signal);
  if (!row) {
    throw new Error(`Unknown AI budget notification signal: ${signal}`);
  }
  return row;
}

export function resolveAiBudgetNotificationSignal(input: {
  killSwitchActive: boolean;
  projectedOverBudget: boolean;
  spentThisPeriodUsd: number;
  monthlyCapUsd: number;
  thresholdRatio?: number;
}): AiBudgetNotificationSignal | null {
  if (input.spentThisPeriodUsd >= input.monthlyCapUsd) {
    return "cap_reached";
  }
  if (input.killSwitchActive) {
    return "kill_switch_active";
  }
  if (input.projectedOverBudget) {
    return "cap_blocked";
  }
  const thresholdRatio = input.thresholdRatio ?? 0.8;
  if (
    input.monthlyCapUsd > 0 &&
    input.spentThisPeriodUsd / input.monthlyCapUsd >= thresholdRatio
  ) {
    return "threshold_warning";
  }
  return null;
}
