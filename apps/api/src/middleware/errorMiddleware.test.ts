import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("errorMiddleware — request body parse safety", () => {
  it("rejects malformed JSON with 400 and no stack or filesystem path details", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .set("Content-Type", "application/json")
        .send("{not-json")
        .expect(400);

      assert.equal(response.body.ok, false);
      assert.equal(response.body.error?.code, "INVALID_JSON");
      const serialized = JSON.stringify(response.body);
      assert.equal(serialized.includes("stack"), false);
      assert.equal(/[A-Za-z]:\\\\|\\\\apps\\\\api|node_modules/.test(serialized), false);
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });
});
