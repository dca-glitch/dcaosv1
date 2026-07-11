import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useUrlFilterState } from "./useUrlFilterState";

const FILTERS = ["all", "active", "archived"] as const;

describe("useUrlFilterState", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/#/projects");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("defaults when the query param is missing", () => {
    const { result } = renderHook(() =>
      useUrlFilterState({
        key: "filter",
        defaultValue: "active",
        allowed: FILTERS,
      }),
    );
    expect(result.current[0]).toBe("active");
  });

  it("reads an existing hash query param", () => {
    window.history.replaceState(null, "", "/#/projects?filter=archived");
    const { result } = renderHook(() =>
      useUrlFilterState({
        key: "filter",
        defaultValue: "active",
        allowed: FILTERS,
      }),
    );
    expect(result.current[0]).toBe("archived");
  });

  it("writes the hash query without changing the path", () => {
    const { result } = renderHook(() =>
      useUrlFilterState({
        key: "filter",
        defaultValue: "active",
        allowed: FILTERS,
      }),
    );

    act(() => {
      result.current[1]("archived");
    });

    expect(result.current[0]).toBe("archived");
    expect(window.location.hash).toBe("#/projects?filter=archived");
  });

  it("omits the param when resetting to the default", () => {
    window.history.replaceState(null, "", "/#/projects?filter=archived");
    const { result } = renderHook(() =>
      useUrlFilterState({
        key: "filter",
        defaultValue: "active",
        allowed: FILTERS,
      }),
    );

    act(() => {
      result.current[1]("active");
    });

    expect(result.current[0]).toBe("active");
    expect(window.location.hash).toBe("#/projects");
  });

  it("falls back to default for disallowed values", () => {
    window.history.replaceState(null, "", "/#/projects?filter=bogus");
    const { result } = renderHook(() =>
      useUrlFilterState({
        key: "filter",
        defaultValue: "active",
        allowed: FILTERS,
      }),
    );
    expect(result.current[0]).toBe("active");
  });

  it("preserves other query params on the same path", () => {
    window.history.replaceState(null, "", "/#/projects?view=list");
    const { result } = renderHook(() =>
      useUrlFilterState({
        key: "filter",
        defaultValue: "active",
        allowed: FILTERS,
      }),
    );

    act(() => {
      result.current[1]("all");
    });

    expect(window.location.hash).toBe("#/projects?view=list&filter=all");
  });
});
