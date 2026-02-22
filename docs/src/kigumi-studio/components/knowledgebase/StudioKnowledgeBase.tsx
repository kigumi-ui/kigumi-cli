import React, { useState, useMemo, useEffect, useRef } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import { Button, Details, Dialog, Icon, Tooltip } from '@/components/ui';

interface KnowledgeItem {
  id: string;
  summary: string;
  contentText: string;
  content: React.ReactNode;
}

const ITEMS: KnowledgeItem[] = [
  {
    id: 'presets',
    summary: 'How do theme presets work?',
    contentText:
      'Kigumi Studio uses the default Web Awesome theme. Presets load full token sets and shadow choices. To switch your project to the default theme, run npx kigumi theme set default.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Theme presets are predefined sets of tokens and styles that give you a
          starting foundation for your project.
        </p>
        <p>
          Kigumi Studio uses the Web Awesome{' '}
          <a
            href="https://webawesome.com/docs/themes"
            target="_blank"
            rel="noopener noreferrer"
          >
            default theme
          </a>{' '}
          which is freely available. To switch your project to the default
          theme, run <code>npx kigumi theme set default</code> in the terminal.
        </p>
      </div>
    ),
  },
  {
    id: 'light-dark-mode',
    summary: 'What is the theme mode?',
    contentText:
      'By switching the theme mode, you can define the light and dark values independently.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          By switching the theme mode, you can define the light and dark values
          independently.
        </p>
        <p>
          Currently Kigumi Studio supports two theme modes: light and dark. The
          theme mode is determined by the <code>.wa-dark</code> class on the
          root <code>&lt;html&gt;</code> element.
        </p>
      </div>
    ),
  },
  {
    id: 'import',
    summary: 'How do I import an existing theme?',
    contentText:
      'Paste theme.css with :root and .wa-dark blocks. Import supports component overrides.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Click import and paste a CSS snippet containing{' '}
          <code>:root {'{}'}</code> and/or <code>.wa-dark {'{}'}</code> blocks
          with <code>--wa-*</code>{' '}
          <a
            href="https://webawesome.com/docs/tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            custom properties
          </a>
          .
        </p>
        <p>You can also add component overrides, for instance:</p>
        <pre>
          <code>
            .Card {'{ '}box-shadow: var(--wa-shadow-l);{' }'}
          </code>
        </pre>
      </div>
    ),
  },
  {
    id: 'export',
    summary: 'How do I use the exported CSS?',
    contentText:
      'Paste into theme.css after kigumi init. Copy button in Export dialog.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Click Export to generate ready-to-paste CSS. Use the Copy button in
          the dialog, then paste into your project&apos;s <code>theme.css</code>{' '}
          file (after running <code>npx kigumi init</code>).
        </p>
      </div>
    ),
  },
  {
    id: 'component-shadows',
    summary: 'How do component shadows work?',
    contentText:
      'Shadows are opt-in per component. Select components in the Shadows section. Unselected components get no box-shadow.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Component shadows are opt-in. In the Shadows section, use the combobox
          to select which components (Card, Button, etc.) receive{' '}
          <code>box-shadow</code>. Unselected components get no shadow.
        </p>
      </div>
    ),
  },
  {
    id: 'brand-color',
    summary: 'How do color colors work?',
    contentText:
      'A single hex color input automatically generates a complete palette (including all shades and semantic color variables). No manual palette editing needed.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Yes, one hex color generates the full palette (steps 05–95) and
          semantic variables (fill, border, on) automatically.
        </p>
        <p>
          If you want to have full control over the color shades, you can define
          the{' '}
          <a
            href="https://webawesome.com/docs/tokens/color/"
            target="_blank"
            rel="noopener noreferrer"
          >
            color properties
          </a>{' '}
          yourself in the <code>:root</code> and <code>.wa-dark</code> blocks:
        </p>
        <pre>
          <code>
            :root {'{'}
            <br />
            --wa-color-brand: #0071ec;
            <br />
            --wa-color-brand-05: #e6f0ff;
            <br />
            {'...'}
            <br />
            --wa-color-brand-95: #002e80;
            <br />
            {'}'}
          </code>
        </pre>
      </div>
    ),
  },
  {
    id: 'auto-save',
    summary: 'Does Kigumi Studio remember my changes?',
    contentText:
      'Yes, your changes are saved automatically in your browser and will remain if you refresh or come back later.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          Yes, your changes are saved to localStorage automatically. Refresh the
          page or return later and your theme edits will still be there.
        </p>
        <p>
          Kigumi Studio doesn't support cross device synchronization yet, that
          is why it is recommended to export your theme to a file and check it
          into your version control system.
        </p>
      </div>
    ),
  },
  {
    id: 'fonts',
    summary: 'Do I need to add font links manually?',
    contentText: 'No. Changing font families loads Bunny Fonts dynamically.',
    content: (
      <div className="wa-stack wa-gap-m">
        <p>
          No, changing font families in the Typography section loads{' '}
          <a
            href="https://fonts.bunny.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bunny Fonts
          </a>{' '}
          dynamically in your code snippet. dynamically in your code snippet.
        </p>
      </div>
    ),
  },
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return debounced;
}

const DIALOG_ID = 'knowledge-base-dialog';

export function StudioKnowledgeBase() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 150);

  const fuse = useMemo(
    () =>
      new Fuse(ITEMS, {
        keys: ['summary', 'contentText'],
        threshold: 0.4,
        includeScore: false,
      }),
    []
  );

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return ITEMS;
    const results = fuse.search(q);
    return results.map((r: FuseResult<KnowledgeItem>) => r.item);
  }, [debouncedQuery, fuse]);

  const showEmptyState = query.trim().length > 0 && filteredItems.length === 0;

  return (
    <>
      <Tooltip for="button-knowledge-base">Open knowledge base</Tooltip>
      <Button
        pill
        variant="neutral"
        size="small"
        appearance="outlined"
        data-dialog="open knowledge-base-dialog"
        id="button-knowledge-base"
      >
        <Icon name="question" />
      </Button>
      <Dialog label="Knowledge Base" id={DIALOG_ID} light-dismiss>
        <div className="wa-stack wa-gap-m">
          <label htmlFor="kb-search" className="wa-visually-hidden">
            Search
          </label>
          <input
            id="kb-search"
            type="search"
            className="wa-body-m"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
          {showEmptyState ? (
            <p className="wa-body-m wa-color-neutral-subtle">
              No results for &quot;{query.trim()}&quot;
            </p>
          ) : (
            <div className="wa-stack wa-gap-m">
              {filteredItems.map((item) => (
                <Details
                  key={item.id}
                  name="faq"
                  appearance="outlined"
                  summary={item.summary}
                >
                  {item.content}
                </Details>
              ))}
            </div>
          )}
        </div>
        <Button slot="footer" variant="brand" data-dialog="close">
          Close
        </Button>
      </Dialog>
    </>
  );
}
