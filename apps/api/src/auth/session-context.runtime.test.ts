import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBearerToken } from "./session-context.runtime";

describe("session context helpers", () => {
  it("extractBearerToken parses bearer headers", () => {
    assert.equal(extractBearerToken("Bearer abc.def"), "abc.def");
    assert.equal(extractBearerToken("bearer token-with-spaces"), "token-with-spaces");
  });

  it("extractBearerToken rejects invalid schemes", () => {
    assert.equal(extractBearerToken("Basic abc"), null);
    assert.equal(extractBearerToken(""), null);
    assert.equal(extractBearerToken(undefined), null);
  });
});
