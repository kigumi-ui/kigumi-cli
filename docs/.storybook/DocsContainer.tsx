import { type PropsWithChildren, useEffect, useState } from 'react';
import {
  DocsContainer as BaseDocsContainer,
  type DocsContainerProps,
} from '@storybook/addon-docs/blocks';
import { addons } from 'storybook/preview-api';
import { kigumiLight, kigumiDark } from './kigumi-themes';

const GLOBALS_UPDATED = 'globalsUpdated';

function resolveTheme(themeKey: string): 'light' | 'dark' {
  if (themeKey === 'dark') return 'dark';
  if (themeKey === 'light') return 'light';
  // system
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getInitialTheme(): string {
  // The iframe URL contains ?globals=theme:XXX — most reliable source on mount
  try {
    const params = new URLSearchParams(window.location.search);
    const globalsStr = params.get('globals') ?? '';
    const match = globalsStr.match(/(?:^|[,&])theme:(\w+)/);
    if (match?.[1]) return match[1];
  } catch {
    // ignore — URL may not be available in SSR/test environments
  }
  // Fallback: last cached channel event
  try {
    const last = addons.getChannel().last(GLOBALS_UPDATED);
    const theme = last?.[0]?.globals?.theme;
    if (theme) return theme as string;
  } catch {
    // ignore — channel may not be initialised yet
  }
  return 'system';
}

export function DocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const { context, children } = props;

  const [themeKey, setThemeKey] = useState<string>(getInitialTheme);

  // React to toolbar theme changes via the Storybook channel
  useEffect(() => {
    const channel = addons.getChannel();
    const handler = (payload: { globals: Record<string, unknown> }) => {
      const theme = (payload?.globals?.theme as string) ?? 'system';
      setThemeKey(theme);
    };
    channel.on(GLOBALS_UPDATED, handler);
    return () => channel.off(GLOBALS_UPDATED, handler);
  }, []);

  // React to OS prefers-color-scheme changes when theme is 'system'
  useEffect(() => {
    if (themeKey !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setThemeKey('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeKey]);

  const resolved = resolveTheme(themeKey);
  const theme = resolved === 'dark' ? kigumiDark : kigumiLight;

  // Apply wa-dark to preview iframe's <html> so WA components get dark tokens
  useEffect(() => {
    document.documentElement.classList.toggle('wa-dark', resolved === 'dark');
  }, [resolved]);

  return (
    <BaseDocsContainer context={context} theme={theme}>
      {children}
    </BaseDocsContainer>
  );
}
