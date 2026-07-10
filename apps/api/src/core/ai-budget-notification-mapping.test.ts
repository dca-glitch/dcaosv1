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
      "cap_reached"
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
});
