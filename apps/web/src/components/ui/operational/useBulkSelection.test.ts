import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBulkSelection } from "./useBulkSelection";

describe("useBulkSelection", () => {
  it("starts empty by default", () => {
    const { result } = renderHook(() => useBulkSelection());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected("a")).toBe(false);
  });

  it("toggles ids and reports selection count", () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.toggle("a");
      result.current.toggle("b");
    });
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isSelected("a")).toBe(true);

    act(() => {
      result.current.toggle("a");
    });
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.isSelected("b")).toBe(true);
  });

  it("persists selection across reorder of the same ids", () => {
    const { result } = renderHook(() => useBulkSelection(["b", "a"]));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(true);

    const orderA = ["a", "b", "c"];
    const orderB = ["c", "b", "a"];
    expect(orderA.filter((id) => result.current.isSelected(id))).toEqual(["a", "b"]);
    expect(orderB.filter((id) => result.current.isSelected(id))).toEqual(["b", "a"]);
  });

  it("supports selectMany, deselectMany, setAll, and clear", () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.selectMany(["a", "b", "c"]);
    });
    expect(result.current.selectedCount).toBe(3);

    act(() => {
      result.current.deselectMany(["b"]);
    });
    expect([...result.current.selectedIds].sort()).toEqual(["a", "c"]);

    act(() => {
      result.current.setAll(["x"]);
    });
    expect([...result.current.selectedIds]).toEqual(["x"]);

    act(() => {
      result.current.clear();
    });
    expect(result.current.selectedCount).toBe(0);
  });
});
