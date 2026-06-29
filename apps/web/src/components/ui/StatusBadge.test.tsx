import { describe, expect, it } from "vitest";
import { getStatusTone } from "./StatusBadge";

describe("getStatusTone", () => {
  it("maps success statuses", () => {
    expect(getStatusTone("DELIVERED")).toBe("success");
    expect(getStatusTone("accepted")).toBe("success");
  });

  it("maps info statuses", () => {
    expect(getStatusTone("DRAFT")).toBe("info");
    expect(getStatusTone("pending")).toBe("info");
  });

  it("maps danger statuses", () => {
    expect(getStatusTone("REJECTED")).toBe("danger");
    expect(getStatusTone("failed")).toBe("danger");
  });

  it("maps muted statuses", () => {
    expect(getStatusTone("archived")).toBe("muted");
  });

  it("defaults unknown statuses to neutral", () => {
    expect(getStatusTone("custom-status")).toBe("neutral");
  });
});
