import { useEffect, useRef } from "react";
import {
  buildEntityEditorHash,
  parseEntityEditorHash,
  type EntityEditorRoute
} from "./entity-editor-hash";

type UseEntityEditorHashOptions = {
  base: string;
  /** Bump when entity list loads/changes so edit deep-links can resolve. */
  listRevision: unknown;
  openCreateFromHash: () => void;
  /** Return true when the entity was found and editor opened. */
  openEditFromHash: (id: string) => boolean;
  closeFromHash: () => void;
};

/**
 * Bidirectional sync between entity list editor state and `#/{base}/new|e/{id}/edit`.
 * Call `navigateEditor` from UI open/close handlers (skipped while applying hash).
 */
export function useEntityEditorHash({
  base,
  listRevision,
  openCreateFromHash,
  openEditFromHash,
  closeFromHash
}: UseEntityEditorHashOptions): {
  navigateEditor: (route: EntityEditorRoute) => void;
} {
  const syncingRef = useRef(false);
  const appliedRef = useRef<string | null>(null);
  const openCreateRef = useRef(openCreateFromHash);
  const openEditRef = useRef(openEditFromHash);
  const closeRef = useRef(closeFromHash);
  openCreateRef.current = openCreateFromHash;
  openEditRef.current = openEditFromHash;
  closeRef.current = closeFromHash;

  function navigateEditor(route: EntityEditorRoute) {
    if (syncingRef.current) return;
    const next = buildEntityEditorHash(base, route);
    appliedRef.current = `${route.kind}:${route.kind === "edit" ? route.id : ""}`;
    if (window.location.hash !== next) {
      window.location.hash = next;
    }
  }

  useEffect(() => {
    const apply = (source: "bootstrap" | "hashchange") => {
      const route = parseEntityEditorHash(window.location.hash, base);
      const routeKey = `${route.kind}:${route.kind === "edit" ? route.id : ""}`;
      syncingRef.current = true;
      try {
        if (route.kind === "hub") {
          appliedRef.current = routeKey;
          closeRef.current();
          return;
        }
        if (source === "bootstrap" && appliedRef.current === routeKey) {
          return;
        }
        if (route.kind === "new") {
          appliedRef.current = routeKey;
          openCreateRef.current();
          return;
        }
        const opened = openEditRef.current(route.id);
        if (opened) {
          appliedRef.current = routeKey;
        }
      } finally {
        window.setTimeout(() => {
          syncingRef.current = false;
        }, 0);
      }
    };

    apply("bootstrap");
    const onHashChange = () => apply("hashchange");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [base, listRevision]);

  return { navigateEditor };
}
