import React, { useEffect, useState } from 'react';
import {
  addons,
  types,
  useGlobals,
  useStorybookApi,
  type HashEntry,
} from 'storybook/manager-api';
import { styled } from 'storybook/theming';
import { kigumiLight, kigumiDark } from './kigumi-themes';

const KIGUMI_THEME_SYNC_ID = 'kigumi/theme-sync';

// Initial theme (system default → dark for Kigumi docs look)
const initialResolved =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

// Icon per sidebar item type
function itemIcon(type: string): string | null {
  if (type === 'component') return '❖';
  if (type === 'story') return '⬦';
  if (type === 'docs') return '';
  return null;
}

// Badge pill styled via Storybook theming
const BadgePill = styled.span<{ bg: string; fg: string }>`
  display: inline-block;
  font-size: 11px;
  line-height: 0.75rem;
  padding: 3px 8px;
  border-radius: 3em;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  background-color: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  flex-shrink: 0;
`;

const LabelContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  margin-right: 28px;
`;

const badgeMap: Record<string, { text: string; bg: string; fg: string }> = {
  pro: {
    text: 'Pro',
    bg: '#6B24AE88',
    fg: '#FFFFFF',
  },
  beta: { text: 'Beta', bg: '#C9C9C988', fg: '#10121A' },
};

// Sidebar label with custom icon + inline tag badges
function LabelWithBadges({ item }: { item: HashEntry }) {
  const icon = itemIcon(item.type);
  const tags = ('tags' in item ? (item.tags as string[]) : undefined) ?? [];

  const badges = tags
    .filter((t) => t in badgeMap)
    .map((t) => {
      const { text, bg, fg } = badgeMap[t];
      return React.createElement(BadgePill, { key: t, bg, fg }, text);
    });

  return React.createElement(
    LabelContainer,
    null,
    icon
      ? React.createElement(
          'span',
          { 'aria-hidden': 'true', style: { fontSize: '20px', lineHeight: 1 } },
          icon
        )
      : null,
    item.name,
    React.createElement('span', { style: { flex: 1 } }),
    ...badges
  );
}

addons.setConfig({
  theme: initialResolved === 'dark' ? kigumiDark : kigumiLight,
  sidebar: {
    collapsedRoots: ['style', 'layout', 'design-tokens', 'components'],
    renderLabel: (item: HashEntry) => {
      if (
        item.type === 'component' ||
        item.type === 'story' ||
        item.type === 'docs' ||
        item.type === 'group'
      ) {
        return React.createElement(LabelWithBadges, { item });
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
    title: 'Theme Sync',
    type: types.TOOL,
    match: ({ viewMode }) => Boolean(viewMode?.match(/^(story|docs)$/)),
    render: () => React.createElement(ThemeSyncInner),
  });
});

// Toolbar badges — show Pro/Beta badges for the current story
const ToolbarBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
`;

function ToolbarBadges() {
  const api = useStorybookApi();
  const story = api.getCurrentStoryData();
  const tags = (story?.tags as string[] | undefined) ?? [];
  const badges = tags
    .filter((t) => t in badgeMap)
    .map((t) => {
      const { text, bg, fg } = badgeMap[t];
      return React.createElement(BadgePill, { key: t, bg, fg }, text);
    });

  if (badges.length === 0) return null;
  return React.createElement(ToolbarBadgeContainer, null, ...badges);
}

addons.register('kigumi/toolbar-badges', () => {
  addons.add('kigumi/toolbar-badges', {
    title: 'Toolbar Badges',
    type: types.TOOL,
    match: ({ viewMode }) => Boolean(viewMode?.match(/^(story|docs)$/)),
    render: () => React.createElement(ToolbarBadges),
  });
});
