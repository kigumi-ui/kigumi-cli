import { useState, useMemo, useEffect } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import LinkTo from '@storybook/addon-links/react';
import { Card, Icon, Input } from '@/components/ui';
import './StorybookComponentGrid.css';

type TopicEntry = {
  name: string;
  description: string;
  kind: string;
  keywords?: string;
};

type TopicCategory = {
  label: string;
  items: TopicEntry[];
};

type FlatEntry = TopicEntry & { category: string };

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function StorybookTopicGrid({
  categories,
}: {
  categories: TopicCategory[];
}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 150);

  const allItems: FlatEntry[] = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, category: cat.label }))
      ),
    [categories]
  );

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: [
          { name: 'name', weight: 3 },
          { name: 'description', weight: 1 },
          { name: 'keywords', weight: 2 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        ignoreFieldNorm: true,
        minMatchCharLength: 2,
      }),
    [allItems]
  );

  const searchResults = useMemo<FlatEntry[]>(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) return [];
    return fuse.search(q).map((r: FuseResult<FlatEntry>) => r.item);
  }, [debouncedQuery, fuse]);

  const isSearching = debouncedQuery.trim().length >= 2;
  const showEmpty = isSearching && searchResults.length === 0;

  const renderCard = (entry: TopicEntry) => (
    <LinkTo key={entry.name} kind={entry.kind} story="docs">
      <Card key={entry.name} appearance="filled-outlined">
        <h3 slot="header" style={{ margin: 0 }} className="wa-heading-l">
          {entry.name}
        </h3>
        <p className="wa-caption-m">{entry.description}</p>
      </Card>
    </LinkTo>
  );

  return (
    <div className="wa-stack wa-gap-4xl">
      <div className="component-search-wrap">
        <Input
          type="search"
          placeholder="Search topics..."
          value={query}
          onInput={(e) =>
            setQuery((e.target as HTMLElement & { value: string }).value)
          }
          with-clear
          onClear={() => setQuery('')}
        >
          <Icon slot="start" name="magnifying-glass" />
        </Input>
      </div>

      {isSearching ? (
        showEmpty ? (
          <p className="wa-body-m component-search-empty">
            No topics match &quot;{debouncedQuery.trim()}&quot;
          </p>
        ) : (
          <div className="component-grid wa-gap-m">
            {searchResults.map(renderCard)}
          </div>
        )
      ) : (
        categories.map((cat) => (
          <div key={cat.label}>
            <h2 className="wa-heading-l wa-gap-s wa-cluster wa-align-items-center">
              <Icon name="tag" />
              {cat.label}
            </h2>
            <div className="component-grid wa-gap-m">
              {cat.items.map(renderCard)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
