import { Search } from "lucide-react";
import { useState } from "react";
import { useFocusTrap } from "./useFocusTrap";

type GlobalSearchOverlayProps = {
  onClose: () => void;
};

/**
 * UI-only global search overlay. No fake results or backend wiring in Phase 2.
 */
export function GlobalSearchOverlay({ onClose }: GlobalSearchOverlayProps) {
  const panelRef = useFocusTrap(true);
  const [query, setQuery] = useState("");

  return (
    <div className="shell-search-overlay" role="presentation">
      <button
        type="button"
        className="shell-search-overlay__backdrop"
        aria-label="Dismiss search"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="shell-global-search"
        className="shell-search-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shell-search-title"
        tabIndex={-1}
      >
        <h2 id="shell-search-title" className="shell-search-overlay__title">
          Search
        </h2>
        <div className="shell-search-overlay__field">
          <Search size={14} strokeWidth={2} aria-hidden="true" className="shell-search-overlay__icon" />
          <input
            type="search"
            className="shell-search-overlay__input"
            placeholder="Search workspaces, clients, and modules…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search query"
            autoComplete="off"
          />
          <button type="button" className="shell-topbar__icon-btn" onClick={onClose} aria-label="Close search">
            Close
          </button>
        </div>
        <div className="shell-search-overlay__empty" role="status">
          {query.trim().length === 0 ? (
            <p>Start typing to search. Results will appear here when search is connected.</p>
          ) : (
            <p>No results available. Search is UI-only in this release.</p>
          )}
        </div>
      </div>
    </div>
  );
}
