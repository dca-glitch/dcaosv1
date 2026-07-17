import { useCallback, useEffect, useState } from "react";

export type UseUrlFilterStateOptions<T extends string> = {
  /** Hash query param name, e.g. `"filter"`. */
  key: string;
  /** Used when the param is missing or not in `allowed`. */
  defaultValue: T;
  /** When set, values outside this list fall back to `defaultValue`. */
  allowed?: readonly T[];
};

function parseHash(hash: string): { path: string; params: URLSearchParams } {
  const raw = hash.replace(/^#\/?/, "");
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) {
    return { path: raw, params: new URLSearchParams() };
  }
  return {
    path: raw.slice(0, qIndex),
    params: new URLSearchParams(raw.slice(qIndex + 1)),
  };
}

function readParam<T extends string>(
  key: string,
  defaultValue: T,
  allowed?: readonly T[],
): T {
  const { params } = parseHash(window.location.hash);
  const raw = params.get(key);
  if (raw == null || raw === "") {
    return defaultValue;
  }
  if (allowed && !allowed.includes(raw as T)) {
    return defaultValue;
  }
  return raw as T;
}

function writeParam(key: string, value: string | null, defaultValue: string): void {
  const { path, params } = parseHash(window.location.hash);
  if (value == null || value === "" || value === defaultValue) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const query = params.toString();
  const nextHash = query ? `#/${path}?${query}` : `#/${path}`;
  if (window.location.hash === nextHash) {
    return;
  }
  // replaceState avoids hashchange when only the query changes (view stays put).
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
}

/**
 * Sync a single filter key/value with hash query params (e.g. `#/projects?filter=active`).
 * Preserves the hash path and other query keys. Does not reload the page.
 */
export function useUrlFilterState<T extends string>(
  options: UseUrlFilterStateOptions<T>,
): [T, (next: T) => void] {
  const { key, defaultValue, allowed } = options;
  const [value, setValue] = useState<T>(() => readParam(key, defaultValue, allowed));

  useEffect(() => {
    function syncFromHash() {
      setValue(readParam(key, defaultValue, allowed));
    }
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [allowed, defaultValue, key]);

  const setFilter = useCallback(
    (next: T) => {
      const resolved =
        allowed && !allowed.includes(next) ? defaultValue : next;
      setValue(resolved);
      writeParam(key, resolved, defaultValue);
    },
    [allowed, defaultValue, key],
  );

  return [value, setFilter];
}
