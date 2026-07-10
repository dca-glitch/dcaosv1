import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLIENT_REVISION_ROUND_LIMIT,
  evaluateRevisionRound,
  getRevisionRoundPersistenceProposal,
  revisionRoundStateFromUsedFlag,
  REVISION_POLICY_VERSION,
  REVISION_ROUND_EXHAUSTED_MESSAGE
} from "./revision-policy";

describe("G579 revision policy helpers", () => {
  it("allows the first revision round and reports nextRoundsUsed", () => {
    const result = evaluateRevisionRound({ roundsUsed: 0, persistenceAvailable: false });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.version, REVISION_POLICY_VERSION);
    assert.equal(result.roundsRemaining, CLIENT_REVISION_ROUND_LIMIT);
    assert.equal(result.wouldConsumeRound, true);
    assert.equal(result.nextRoundsUsed, 1);
  });

  it("exhausts after the single allowed round", () => {
    const result = evaluateRevisionRound({ roundsUsed: 1, persistenceAvailable: true });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "REVISION_ROUND_EXHAUSTED");
    assert.equal(result.message, REVISION_ROUND_EXHAUSTED_MESSAGE);
    assert.equal(result.roundsRemaining, 0);
  });

  it("maps revisionRoundUsed flag onto round state", () => {
    assert.deepEqual(revisionRoundStateFromUsedFlag(false), {
      roundsUsed: 0,
      persistenceAvailable: false
    });
    assert.deepEqual(revisionRoundStateFromUsedFlag(true, true), {
      roundsUsed: CLIENT_REVISION_ROUND_LIMIT,
      persistenceAvailable: true
    });
  });

  it("documents deferred persistence proposal without approving schema", () => {
    const proposal = getRevisionRoundPersistenceProposal();
    assert.equal(proposal.schemaChangeApproved, false);
    assert.equal(proposal.proposedField, "clientRevisionRoundUsed");
    assert.equal(proposal.model, "AiDeliveryDeliverable");
    assert.equal(proposal.resetOn, "send_for_client_review");
  });
});
