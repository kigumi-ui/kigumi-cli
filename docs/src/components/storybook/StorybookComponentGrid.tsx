import { useState, useMemo, useEffect } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import LinkTo from '@storybook/addon-links/react';
import { Card, Icon, Input } from '@/components/ui';
import './StorybookComponentGrid.css';

type ComponentEntry = {
  name: string;
  description: string;
  kind?: string;
  icon?: string;
};

const componentsByCategory: Record<string, ComponentEntry[]> = {
  Actions: [
    {
      name: 'Button',
      description:
        'Triggers actions: form submissions, navigation, and custom handlers.',
      kind: 'Components/Button',
      icon: './components/button.png',
    },
    {
      name: 'Button Group',
      description: 'Joins related buttons into a single connected control.',
      kind: 'Components/Button Group',
      icon: './components/button-group.png',
    },
    {
      name: 'Copy Button',
      description: 'Copies a value to the clipboard with visual confirmation.',
      kind: 'Components/Copy Button',
      icon: './components/copy-button.png',
    },
    {
      name: 'Dropdown',
      description: 'Attaches a contextual menu to a trigger element.',
      kind: 'Components/Dropdown',
      icon: './components/dropdown.png',
    },
    {
      name: 'Dropdown Item',
      description:
        'A single action, checkbox, or radio entry inside a Dropdown.',
      kind: 'Components/Dropdown Item',
      icon: './components/dropdown-item.png',
    },
    {
      name: 'QR Code',
      description: 'Generates a scannable QR code from any string value.',
      kind: 'Components/QR Code',
      icon: './components/qr-code.png',
    },
  ],
  'Feedback & Status': [
    {
      name: 'Badge',
      description: 'Small status indicator for counts, states, or labels.',
      kind: 'Components/Badge',
    },
    {
      name: 'Callout',
      description: 'Highlights important information or warnings inline.',
      kind: 'Components/Callout',
    },
    {
      name: 'Progress Bar',
      description: 'Visualises task completion as a filled horizontal track.',
      kind: 'Components/Progress Bar',
    },
    {
      name: 'Progress Ring',
      description: 'Displays progress as a circular arc for dashboards.',
      kind: 'Components/Progress Ring',
    },
    {
      name: 'Skeleton',
      description: 'Placeholder shape that mimics content while it loads.',
      kind: 'Components/Skeleton',
    },
    {
      name: 'Spinner',
      description: 'Rotating animation that indicates ongoing activity.',
      kind: 'Components/Spinner',
    },
    {
      name: 'Tag',
      description: 'Compact label for categorising or annotating content.',
      kind: 'Components/Tag',
    },
    {
      name: 'Toast',
      description:
        'Manages and stacks lightweight notification banners at a screen edge.',
      kind: 'Components/Toast',
    },
    {
      name: 'Toast Item',
      description:
        'Single notification banner with variants, icons, and auto-dismiss.',
      kind: 'Components/Toast Item',
    },
    {
      name: 'Tooltip',
      description:
        'Brief text label that appears near a trigger on hover or focus.',
      kind: 'Components/Tooltip',
    },
  ],
  'Form Controls': [
    {
      name: 'Checkbox',
      description:
        'Binary toggle for a boolean value with indeterminate support.',
      kind: 'Components/Checkbox',
    },
    {
      name: 'Color Picker',
      description:
        'Full-featured color selection with hue, saturation, and swatches.',
      kind: 'Components/Color Picker',
    },
    {
      name: 'Combobox',
      description: 'Text input combined with a filterable dropdown list.',
      kind: 'Components/Combobox',
    },
    {
      name: 'File Input',
      description: 'Lets users select and upload one or more files.',
      kind: 'Components/File Input',
    },
    {
      name: 'Input',
      description:
        'Single-line text entry supporting all standard HTML input types.',
      kind: 'Components/Input',
    },
    {
      name: 'Number Input',
      description: 'Numeric input with increment and decrement controls.',
      kind: 'Components/Number Input',
    },
    {
      name: 'Option',
      description:
        'Selectable item used inside Select, Combobox, and similar controls.',
      kind: 'Components/Option',
    },
    {
      name: 'Radio',
      description: 'Single option in a mutually exclusive selection group.',
      kind: 'Components/Radio',
    },
    {
      name: 'Radio Group',
      description:
        'Manages a set of Radio options with shared selection state.',
      kind: 'Components/Radio Group',
    },
    {
      name: 'Rating',
      description: 'Captures a numeric score via a row of star symbols.',
      kind: 'Components/Rating',
    },
    {
      name: 'Select',
      description:
        'Dropdown list of Option children for single or multiple selection.',
      kind: 'Components/Select',
    },
    {
      name: 'Slider',
      description: 'Selects a numeric value by dragging a thumb along a track.',
      kind: 'Components/Slider',
    },
    {
      name: 'Switch',
      description: 'Toggle that represents an immediate on/off boolean state.',
      kind: 'Components/Switch',
    },
    {
      name: 'Textarea',
      description:
        'Multi-line text entry with configurable resize and auto-grow.',
      kind: 'Components/Textarea',
    },
  ],
  Imagery: [
    {
      name: 'Animated Image',
      description:
        'Displays animated GIFs and WebPs with user-controlled playback.',
      kind: 'Components/Animated Image',
    },
    {
      name: 'Avatar',
      description:
        'Represents a person with an image, initials, or icon fallback.',
      kind: 'Components/Avatar',
    },
    {
      name: 'Carousel',
      description:
        'Scrollable slide sequence with navigation arrows and pagination.',
      kind: 'Components/Carousel',
    },
    {
      name: 'Carousel Item',
      description: 'A single slide container within a Carousel.',
      kind: 'Components/Carousel Item',
    },
    {
      name: 'Comparison',
      description: 'Before/after image viewer with a draggable divider.',
      kind: 'Components/Comparison',
    },
    {
      name: 'Icon',
      description: 'Scalable vector symbol from the Web Awesome icon set.',
      kind: 'Components/Icon',
    },
    {
      name: 'Zoomable Frame',
      description:
        'Iframe with built-in zoom controls and discrete zoom levels.',
      kind: 'Components/Zoomable Frame',
    },
  ],
  Navigation: [
    {
      name: 'Breadcrumb',
      description:
        'Trail of navigational links showing the current page hierarchy.',
      kind: 'Components/Breadcrumb',
    },
    {
      name: 'Breadcrumb Item',
      description: 'Individual link or label within a Breadcrumb component.',
      kind: 'Components/Breadcrumb Item',
    },
    {
      name: 'Tab',
      description:
        'Navigation trigger linked to a Tab Panel inside a Tab Group.',
      kind: 'Components/Tab',
    },
    {
      name: 'Tab Group',
      description:
        'Orchestrates Tab and Tab Panel components with active-state management.',
      kind: 'Components/Tab Group',
    },
    {
      name: 'Tab Panel',
      description: 'Content container shown when its associated Tab is active.',
      kind: 'Components/Tab Panel',
    },
    {
      name: 'Tree',
      description:
        'Hierarchical list with expandable nodes and single/multi selection.',
      kind: 'Components/Tree',
    },
    {
      name: 'Tree Item',
      description:
        'A node in a Tree with expand, select, disable, and lazy-load support.',
      kind: 'Components/Tree Item',
    },
  ],
  Organization: [
    {
      name: 'Card',
      description:
        'Versatile container grouping related content with header, body, and footer.',
      kind: 'Components/Card',
    },
    {
      name: 'Details',
      description:
        'Collapsible disclosure widget with a summary trigger and expandable body.',
      kind: 'Components/Details',
    },
    {
      name: 'Dialog',
      description:
        'Modal overlay with focus trapping for confirmations and forms.',
      kind: 'Components/Dialog',
    },
    {
      name: 'Divider',
      description:
        'Thin horizontal or vertical rule for separating content sections.',
      kind: 'Components/Divider',
    },
    {
      name: 'Drawer',
      description: 'Panel that slides in from any edge of the viewport.',
      kind: 'Components/Drawer',
    },
    {
      name: 'Page',
      description:
        'Application shell with header, side navigation, content, and footer.',
      kind: 'Components/Page',
    },
    {
      name: 'Scroller',
      description:
        'Scrollable container with edge shadow indicators for overflow.',
      kind: 'Components/Scroller',
    },
    {
      name: 'Split Panel',
      description: 'Two resizable panes separated by a draggable divider.',
      kind: 'Components/Split Panel',
    },
  ],
  'Data Display': [
    {
      name: 'Chart',
      description:
        'Renders interactive visualisations such as bars, lines, pies, and more.',
      kind: 'Components/Chart',
    },
    {
      name: 'Sparkline',
      description:
        'Compact inline chart for visualising data trends at a glance.',
      kind: 'Components/Sparkline',
    },
    {
      name: 'Bar Chart',
      description:
        'Displays categorical data as horizontal or vertical rectangular bars scaled to their values.',
      kind: 'Components/Bar Chart',
    },
    {
      name: 'Bubble Chart',
      description:
        'Plots three-dimensional data using position and circle size to encode a third variable.',
      kind: 'Components/Bubble Chart',
    },
    {
      name: 'Doughnut Chart',
      description:
        'Shows proportional segments in a ring shape with an open center for summary content.',
      kind: 'Components/Doughnut Chart',
    },
    {
      name: 'Line Chart',
      description:
        'Connects sequential data points to reveal trends and patterns over a continuous axis.',
      kind: 'Components/Line Chart',
    },
    {
      name: 'Pie Chart',
      description:
        "Divides a circle into wedges that represent each category's share of the whole.",
      kind: 'Components/Pie Chart',
    },
    {
      name: 'Polar Area Chart',
      description:
        'Arranges segments of equal angle but varying radius around a central point.',
      kind: 'Components/Polar Area Chart',
    },
    {
      name: 'Radar Chart',
      description:
        'Maps multiple variables onto radial axes to compare profiles at a glance.',
      kind: 'Components/Radar Chart',
    },
    {
      name: 'Scatter Chart',
      description:
        'Positions individual data points by two numeric axes to expose correlations.',
      kind: 'Components/Scatter Chart',
    },
  ],
  Utilities: [
    {
      name: 'Animation',
      description:
        'Plays named keyframe animations from the Web Animations API.',
      kind: 'Components/Animation',
    },
    {
      name: 'Format Bytes',
      description:
        'Converts a byte count to a human-readable string (KB, MB, GB).',
      kind: 'Components/Format Bytes',
    },
    {
      name: 'Format Date',
      description: 'Formats a date-time value using Intl.DateTimeFormat.',
      kind: 'Components/Format Date',
    },
    {
      name: 'Format Number',
      description:
        'Formats numbers with Intl.NumberFormat for currency, percent, and more.',
      kind: 'Components/Format Number',
    },
    {
      name: 'Include',
      description: 'Fetches and injects external HTML content into the page.',
      kind: 'Components/Include',
    },
    {
      name: 'Intersection Observer',
      description:
        'Fires events when an element enters or leaves the viewport.',
      kind: 'Components/Intersection Observer',
    },
    {
      name: 'Mutation Observer',
      description: 'Declarative wrapper around the MutationObserver API.',
      kind: 'Components/Mutation Observer',
    },
    {
      name: 'Popover',
      description:
        'Rich floating panel anchored to a trigger with auto-positioning.',
      kind: 'Components/Popover',
    },
    {
      name: 'Popup',
      description: 'Low-level positioning primitive built on Floating UI.',
      kind: 'Components/Popup',
    },
    {
      name: 'Relative Time',
      description:
        'Formats a date as a locale-aware relative string (e.g. "3 minutes ago").',
      kind: 'Components/Relative Time',
    },
    {
      name: 'Resize Observer',
      description: 'Declarative wrapper around the ResizeObserver API.',
      kind: 'Components/Resize Observer',
    },
  ],
};

const categoryOrder = [
  'Actions',
  'Data Display',
  'Feedback & Status',
  'Form Controls',
  'Imagery',
  'Navigation',
  'Organization',
  'Utilities',
];

type FlatComponentEntry = ComponentEntry & { category: string };

const allComponents: FlatComponentEntry[] = Object.entries(
  componentsByCategory
).flatMap(([category, components]) =>
  components.map((c) => ({ ...c, category }))
);

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function StorybookComponentGrid() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 150);

  const fuse = useMemo(
    () =>
      new Fuse(allComponents, {
        keys: [
          { name: 'name', weight: 2 },
          { name: 'description', weight: 1 },
        ],
        threshold: 0.35,
        includeScore: false,
        minMatchCharLength: 2,
      }),
    []
  );

  const searchResults = useMemo<FlatComponentEntry[]>(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) return [];
    return fuse.search(q).map((r: FuseResult<FlatComponentEntry>) => r.item);
  }, [debouncedQuery, fuse]);

  const isSearching = debouncedQuery.trim().length >= 2;
  const showEmpty = isSearching && searchResults.length === 0;

  const renderCard = (c: ComponentEntry) => {
    const card = (
      <Card key={c.name} appearance="filled-outlined">
        <h3 slot="header" style={{ margin: 0 }} className="wa-heading-l">
          {c.name}
        </h3>
        <p className="wa-caption-m">{c.description}</p>
      </Card>
    );
    return c.kind ? (
      <LinkTo key={c.name} kind={c.kind} story="docs">
        {card}
      </LinkTo>
    ) : (
      card
    );
  };

  return (
    <div className="wa-stack wa-gap-4xl">
      <div className="component-search-wrap">
        <Input
          type="search"
          placeholder="Search components..."
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
            No components match &quot;{debouncedQuery.trim()}&quot;
          </p>
        ) : (
          <div className="component-grid wa-gap-m">
            {searchResults.map(renderCard)}
          </div>
        )
      ) : (
        categoryOrder.map((category) => (
          <div key={category}>
            <h2 className="wa-heading-l wa-gap-s wa-cluster wa-align-items-center">
              <Icon name="tag" />
              {category}
            </h2>
            <div className="component-grid wa-gap-m">
              {(componentsByCategory[category] || []).map(renderCard)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
