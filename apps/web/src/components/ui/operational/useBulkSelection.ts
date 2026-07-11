import { useCallback, useMemo, useState } from "react";

export type UseBulkSelectionResult = {
  selectedIds: ReadonlySet<string>;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectMany: (ids: Iterable<string>) => void;
  deselectMany: (ids: Iterable<string>) => void;
  clear: () => void;
  setAll: (ids: Iterable<string>) => void;
};

/**
 * Set-based multi-select that persists across sort/reorder of the same ids.
 */
export function useBulkSelection(initialIds?: Iterable<string>): UseBulkSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialIds ?? []),
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectMany = useCallback((ids: Iterable<string>) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const deselectMany = useCallback((ids: Iterable<string>) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const setAll = useCallback((ids: Iterable<string>) => {
    setSelectedIds(new Set(ids));
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  return useMemo(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      isSelected,
      toggle,
      selectMany,
      deselectMany,
      clear,
      setAll,
    }),
    [clear, deselectMany, isSelected, selectMany, selectedIds, setAll, toggle],
  );
}
