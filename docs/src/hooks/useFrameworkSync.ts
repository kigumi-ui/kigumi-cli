import { useSyncExternalStore } from 'react';

type Framework = 'react' | 'vue' | 'angular' | 'nextjs';

let current: Framework = 'react';

try {
  const stored = localStorage.getItem('kigumi-docs-fw');
  if (
    stored === 'react' ||
    stored === 'vue' ||
    stored === 'angular' ||
    stored === 'nextjs'
  ) {
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

function getSnapshot(): Framework {
  return current;
}

function getServerSnapshot(): Framework {
  return 'react';
}

export function setFramework(fw: Framework) {
  if (fw === current) return;
  current = fw;
  try {
    localStorage.setItem('kigumi-docs-fw', fw);
  } catch {
    // localStorage unavailable
  }
  listeners.forEach((l) => l());
}

export function useFrameworkSync(): [Framework, typeof setFramework] {
  const framework = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  return [framework, setFramework];
}
