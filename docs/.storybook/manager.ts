import React, { useEffect, useState } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';
import { kigumiLight, kigumiDark } from './kigumi-themes';

const KIGUMI_THEME_SYNC_ID = 'kigumi/theme-sync';

// Initial theme (system default → dark for Kigumi docs look)
const initialResolved =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
addons.setConfig({
  theme: initialResolved === 'dark' ? kigumiDark : kigumiLight,
  tagBadges: [
    {
      tags: 'pro',
      badge: {
        text: 'Pro',
        bgColor: '#001c13',
        fgColor: '#e0eb0b',
        tooltip: 'Requires Web Awesome Pro license',
      },
    },
    {
      tags: 'experimental',
      badge: {
        text: 'Experimental',
        bgColor: '#7c2d12',
        fgColor: '#fed7aa',
        tooltip: 'API may change in future releases',
      },
    },
  ],
  sidebar: {
    collapsedRoots: ['style', 'layout', 'design-tokens', 'components'],
    renderLabel: (item: { type: string; name: string }) => {
      if (item.type === 'component') {
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'span',
            {
              'aria-hidden': 'true',
              style: {
                fontSize: '20px',
              },
            },
            '❖'
          ),
          item.name
        );
      }

      if (item.type == 'story') {
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'span',
            {
              'aria-hidden': 'true',
              style: { fontSize: '20px', lineHeight: 1 },
            },
            '⬦'
          ),
          item.name
        );
      }

      if (item.type === 'document') {
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'span',
            {
              'aria-hidden': 'true',
              style: { fontSize: '20px', lineHeight: 1 },
            },
            '⬦'
          ),
          item.name
        );
      }
      return item.name;
    },
  },
});

function resolveTheme(theme: string): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (theme === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

function ThemeSyncInner() {
  const [globals] = useGlobals();
  const themeKey = globals?.theme ?? 'system';
  const resolved = resolveTheme(themeKey);
  const theme = resolved === 'dark' ? kigumiDark : kigumiLight;

  const [, setTick] = useState(0);

  useEffect(() => {
    addons.setConfig({ theme });
  }, [theme, resolved]);

  useEffect(() => {
    if (themeKey !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTick((t) => t + 1);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeKey]);

  return null;
}

addons.register(KIGUMI_THEME_SYNC_ID, () => {
  addons.add(KIGUMI_THEME_SYNC_ID, {
    type: types.TOOL,
    match: ({ viewMode }) => Boolean(viewMode?.match(/^(story|docs)$/)),
    render: () => React.createElement(ThemeSyncInner),
  });
});
