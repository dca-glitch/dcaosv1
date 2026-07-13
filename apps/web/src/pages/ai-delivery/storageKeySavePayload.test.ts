import { describe, expect, it } from "vitest";

/**
 * Mirrors App.tsx omit-blank-storageKey behavior for update payloads.
 * Summaries redact storageKey; blank edit forms must not clear durable keys.
 */
function omitBlankStorageKeyOnUpdate<T extends { storageKey?: string | null }>(
  values: T,
  isUpdate: boolean
): T | Omit<T, "storageKey"> {
  if (!isUpdate || (values.storageKey ?? "").trim()) {
    return values;
  }
  const { storageKey: _omit, ...rest } = values;
  return rest;
}

describe("private storageKey save payload", () => {
  it("omits blank storageKey on article-image update", () => {
    const body = omitBlankStorageKeyOnUpdate(
      {
        title: "Hero",
        prompt: "prompt",
        storageKey: "",
        notes: "n"
      },
      true
    );
    expect(body).toEqual({ title: "Hero", prompt: "prompt", notes: "n" });
    expect("storageKey" in body).toBe(false);
  });

  it("omits null storageKey on deliverable update", () => {
    const body = omitBlankStorageKeyOnUpdate(
      {
        title: "Package",
        storageKey: null,
        notes: "notes"
      },
      true
    );
    expect(body).toEqual({ title: "Package", notes: "notes" });
    expect("storageKey" in body).toBe(false);
  });

  it("keeps explicit storageKey on update", () => {
    const body = omitBlankStorageKeyOnUpdate(
      {
        title: "Hero",
        storageKey: "tenants/t/objects/a.png"
      },
      true
    );
    expect(body).toEqual({
      title: "Hero",
      storageKey: "tenants/t/objects/a.png"
    });
  });

  it("keeps blank storageKey on create", () => {
    const body = omitBlankStorageKeyOnUpdate(
      {
        title: "New",
        storageKey: ""
      },
      false
    );
    expect(body).toEqual({ title: "New", storageKey: "" });
  });
});
