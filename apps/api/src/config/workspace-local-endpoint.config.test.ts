import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isWorkspaceLocalEndpointEnabled } from "./workspace-local-endpoint.config";

describe("workspace local endpoint feature flag", () => {
  const local = { NODE_ENV: "development", WORKSPACE_LOCAL_ENDPOINT_ENABLED: "true", DATABASE_URL: "postgresql://opaque@127.0.0.1:5434/opaque" } as NodeJS.ProcessEnv;
  it("defaults closed and permits only the exact local source target", () => {
    assert.equal(isWorkspaceLocalEndpointEnabled({}), false);
    assert.equal(isWorkspaceLocalEndpointEnabled({ ...local, WORKSPACE_LOCAL_ENDPOINT_ENABLED: "false" }), false);
    assert.equal(isWorkspaceLocalEndpointEnabled({ ...local, NODE_ENV: "test" }), false);
    assert.equal(isWorkspaceLocalEndpointEnabled({ ...local, DATABASE_URL: "postgresql://opaque@127.0.0.1:5435/opaque" }), false);
    assert.equal(isWorkspaceLocalEndpointEnabled(local), true);
  });
});
