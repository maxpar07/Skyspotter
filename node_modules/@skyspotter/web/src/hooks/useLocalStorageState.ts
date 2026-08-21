// apps/web/src/hooks/useLocalStorageState.ts
//
// Small generic persistence hook — same shape as useState, but backed by
// localStorage so a choice (like which radar rings are on) survives a
// reload instead of resetting every visit. Reads/writes are wrapped since
// localStorage can throw (private browsing, quota, disabled storage) —
// in that case the state still works for the current session, it just
// won't persist.

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored != null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage unavailable — nothing to do, state stays in-memory only.
    }
  }, [key, state]);

  return [state, setState];
}
