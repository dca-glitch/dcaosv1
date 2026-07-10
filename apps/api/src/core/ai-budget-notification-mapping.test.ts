import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_BUDGET_NOTIFICATION_MAPPING_VERSION,
  getAiBudgetNotificationMappingContract,
  mapAiBudgetSignalToExistingNotification,
  resolveAiBudgetNotificationSignal
} from "./ai-budget-notification-mapping";

describe("ai-budget-notification-mapping", () => {
  it("maps budget signals onto existing Lane 2 event keys without proposing new keys", () => {
    const contract = getAiBudgetNotificationMappingContract();

    assert.equal(contract.version, AI_BUDGET_NOTIFICATION_MAPPING_VERSION);
    assert.equal(contract.lane2Ownership, "notification-events_owned_elsewhere");
    assert.deepEqual(contract.proposedNewEventKeys, []);
    assert.equal(contract.mappings.length, 4);

    const threshold = mapAiBudgetSignalToExistingNotification("threshold_warning");
    assert.equal(threshold.businessEventKey, "BUDGET_THRESHOLD_WARNING");
    assert.equal(threshold.notificationEventType, "budget_threshold_warning");
    assert.equal(threshold.aiNotificationEventType, "budget_warning");
    assert.equal(threshold.sendDefault, "no_send_until_owner_gate");

    const blocked = mapAiBudgetSignalToExistingNotification("cap_blocked");
    assert.equal(blocked.businessEventKey, "BUDGET_CAP_BLOCKED");

    const reached = mapAiBudgetSignalToExistingNotification("cap_reached");
    assert.equal(reached.businessEventKey, "BUDGET_CAP_REACHED");
    assert.equal(reached.notificationEventType, "budget_cap_reached");
  });

  it("resolves threshold, blocked, and reached signals from budget snapshot fields", () => {
    assert.equal(
      resolveAiBudgetNotificationSignal({
        killSwitchActive: false,
        projectedOverBudget: false,
        spentThisPeriodUsd: 85,
        monthlyCapUsd: 100
      }),
      "threshold_warning"
    );
    assert.equal(
      resolveAiBudgetNotificationSignal({
        killSwitchActive: false,
        projectedOverBudget: true,
        spentThisPeriodUsd: 90,
        monthlyCapUsd: 100
      }),
      "cap_blocked"
    );
    assert.equal(
      resolveAiBudgetNotificationSignal({
        killSwitchActive: true,
        projectedOverBudget: true,
        spentThisPeriodUsd: 100,
        monthlyCapUsd: 100
      }),
      "kill_switch_active"
    );
    assert.equal(
      resolveAiBudgetNotificationSignal({
        killSwitchActive: false,
        projectedOverBudget: false,
        spentThisPeriodUsd: 10,
        monthlyCapUsd: 100
      }),
      null
    );
  });

  it("G620: threshold warning maps to BUDGET_THRESHOLD_WARNING with no-send default", () => {
    const signal = resolveAiBudgetNotificationSignal({
      killSwitchActive: false,
      projectedOverBudget: false,
      spentThisPeriodUsd: 80,
      monthlyCapUsd: 100,
      thresholdRatio: 0.8
    });
    assert.equal(signal, "threshold_warning");
    const mapped = mapAiBudgetSignalToExistingNotification("threshold_warning");
    assert.equal(mapped.businessEventKey, "BUDGET_THRESHOLD_WARNING");
    assert.equal(mapped.notificationEventType, "budget_threshold_warning");
    assert.equal(mapped.aiNotificationEventType, "budget_warning");
    assert.equal(mapped.severityHint, "warning");
    assert.equal(mapped.sendDefault, "no_send_until_owner_gate");
  });

  it("G621: cap blocked maps to BUDGET_CAP_BLOCKED without inventing new keys", () => {
    const signal = resolveAiBudgetNotificationSignal({
      killSwitchActive: false,
      projectedOverBudget: true,
      spentThisPeriodUsd: 95,
      monthlyCapUsd: 100
    });
    assert.equal(signal, "cap_blocked");
    const mapped = mapAiBudgetSignalToExistingNotification("cap_blocked");
    assert.equal(mapped.businessEventKey, "BUDGET_CAP_BLOCKED");
    assert.equal(mapped.notificationEventType, "budget_cap_blocked");
    assert.equal(mapped.severityHint, "blocked");
    assert.equal(mapped.sendDefault, "no_send_until_owner_gate");
    const contract = getAiBudgetNotificationMappingContract();
    assert.deepEqual(contract.proposedNewEventKeys, []);
  });

  it("maps kill_switch_active to kill_switch and prefers it over cap_reached", () => {
    const signal = resolveAiBudgetNotificationSignal({
      killSwitchActive: true,
      projectedOverBudget: false,
      spentThisPeriodUsd: 100,
      monthlyCapUsd: 100
    });
    assert.equal(signal, "kill_switch_active");
    const mapped = mapAiBudgetSignalToExistingNotification("kill_switch_active");
    assert.equal(mapped.businessEventKey, "KILL_SWITCH");
    assert.equal(mapped.notificationEventType, "kill_switch");
    assert.equal(mapped.aiNotificationEventType, "kill_switch");
    assert.equal(mapped.severityHint, "critical");

    const capReached = mapAiBudgetSignalToExistingNotification("cap_reached");
    assert.equal(capReached.severityHint, "blocked");
  });
});
