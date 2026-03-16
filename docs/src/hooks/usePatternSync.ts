import { useSyncExternalStore } from 'react';

type Pattern = 'apps' | 'packages';

let current: Pattern = 'apps';

try {
  const stored = localStorage.getItem('kigumi-docs-pattern');
  if (stored === 'apps' || stored === 'packages') {
    current = stored;
  }
} catch {
  // SSR or localStorage unavailable
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Pattern {
  return current;
}

function getServerSnapshot(): Pattern {
  return 'apps';
}

export function setPattern(pattern: Pattern) {
  if (pattern === current) return;
  current = pattern;
  try {
    localStorage.setItem('kigumi-docs-pattern', pattern);
  } catch {
    // localStorage unavailable
  }
  listeners.forEach((l) => l());
}

export function usePatternSync(): [Pattern, typeof setPattern] {
  const pattern = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  return [pattern, setPattern];
}
