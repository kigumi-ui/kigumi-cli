import { useState, useMemo, useEffect } from 'react';
import Fuse, { type FuseResult } from 'fuse.js';
import LinkTo from '@storybook/addon-links/react';
import { Card, Icon, Input } from '@/components/ui';
import buttonImage from '@/assets/components/button.png';
import buttonGroupImage from '@/assets/components/button-group.png';
import copyButtonImage from '@/assets/components/copy-button.png';
import dropdownImage from '@/assets/components/dropdown.png';
import dropdownItemImage from '@/assets/components/dropdown-item.png';
import qrCodeImage from '@/assets/components/qr.png';
import chartImage from '@/assets/components/chart.png';
import sparklineImage from '@/assets/components/sparkline.png';
import barChartImage from '@/assets/components/bar-chart.png';
import bubbleChartImage from '@/assets/components/bubble-chart.png';
import doughnutChartImage from '@/assets/components/doughnut-chart.png';
import lineChartImage from '@/assets/components/line-chart.png';
import pieChartImage from '@/assets/components/pie-chart.png';
import polarAreaChartImage from '@/assets/components/polar-area-chart.png';
import radarChartImage from '@/assets/components/radar-chart.png';
import scatterChartImage from '@/assets/components/scatter-chart.png';
import badgeImage from '@/assets/components/badge.png';
import calloutImage from '@/assets/components/callout.png';
import progressBarImage from '@/assets/components/progress-bar.png';
import progressRingImage from '@/assets/components/progress-ring.png';
import skeletonImage from '@/assets/components/skeleton.png';
import spinnerImage from '@/assets/components/spinner.png';
import tagImage from '@/assets/components/tag.png';
import toastImage from '@/assets/components/toast.png';
import toastItemImage from '@/assets/components/toast-item.png';
import tooltipImage from '@/assets/components/tooltip.png';
import checkboxImage from '@/assets/components/checkbox.png';
import colorPickerImage from '@/assets/components/color-picker.png';
import comboboxImage from '@/assets/components/combobox.png';
import fileInputImage from '@/assets/components/file-input.png';
import inputImage from '@/assets/components/input.png';
import numberInputImage from '@/assets/components/number-input.png';
import optionImage from '@/assets/components/option.png';
import radioImage from '@/assets/components/radio.png';
import radioGroupImage from '@/assets/components/radio-group.png';
import ratingImage from '@/assets/components/rating.png';
import selectImage from '@/assets/components/select.png';
import sliderImage from '@/assets/components/slider.png';
import switchImage from '@/assets/components/switch.png';
import textareaImage from '@/assets/components/textarea.png';
import animatedImageImage from '@/assets/components/animated-image.png';
import avatarImage from '@/assets/components/avatar.png';
import carouselImage from '@/assets/components/carousel.png';
import carouselItemImage from '@/assets/components/carousel-item.png';
import comparisonImage from '@/assets/components/comparison.png';
import iconImage from '@/assets/components/icon.png';
import zoomableFrameImage from '@/assets/components/zoomable-frame.png';
import breadcrumbImage from '@/assets/components/breadcrumb.png';
import breadcrumbItemImage from '@/assets/components/breadcrumb-item.png';
import tabImage from '@/assets/components/tab.png';
import tabGroupImage from '@/assets/components/tab-group.png';
import tabPanelImage from '@/assets/components/tab-panel.png';
import treeImage from '@/assets/components/tree.png';
import treeItemImage from '@/assets/components/tree-item.png';
import cardImage from '@/assets/components/card.png';
import detailsImage from '@/assets/components/details.png';
import dialogImage from '@/assets/components/dialog.png';
import dividerImage from '@/assets/components/divider.png';
import drawerImage from '@/assets/components/drawer.png';
import pageImage from '@/assets/components/page.png';
import scrollerImage from '@/assets/components/scroller.png';
import splitPanelImage from '@/assets/components/split-panel.png';
import animationImage from '@/assets/components/animation.png';
import formatBytesImage from '@/assets/components/format-bytes.png';
import formatDateImage from '@/assets/components/format-date.png';
import formatNumberImage from '@/assets/components/format-number.png';
import includeImage from '@/assets/components/include.png';
import intersectionObserverImage from '@/assets/components/intersection-observer.png';
import mutationObserverImage from '@/assets/components/mutation-observer.png';
import popoverImage from '@/assets/components/popover.png';
import popupImage from '@/assets/components/popup.png';
import relativeTimeImage from '@/assets/components/relative-time.png';
import resizeObserverImage from '@/assets/components/resize-observer.png';
import './StorybookComponentGrid.css';

type ComponentEntry = {
  name: string;
  description: string;
  kind?: string;
  imageUrl?: string;
};

const componentsByCategory: Record<string, ComponentEntry[]> = {
  Actions: [
    {
      name: 'Button',
      description:
        'Triggers actions: form submissions, navigation, and custom handlers.',
      kind: 'Components/Button',
      imageUrl: buttonImage,
    },
    {
      name: 'Button Group',
      description: 'Joins related buttons into a single connected control.',
      kind: 'Components/Button Group',
      imageUrl: buttonGroupImage,
    },
    {
      name: 'Copy Button',
      description: 'Copies a value to the clipboard with visual confirmation.',
      kind: 'Components/Copy Button',
      imageUrl: copyButtonImage,
    },
    {
      name: 'Dropdown',
      description: 'Attaches a contextual menu to a trigger element.',
      kind: 'Components/Dropdown',
      imageUrl: dropdownImage,
    },
    {
      name: 'Dropdown Item',
      description:
        'A single action, checkbox, or radio entry inside a Dropdown.',
      kind: 'Components/Dropdown Item',
      imageUrl: dropdownItemImage,
    },
    {
      name: 'QR Code',
      description: 'Generates a scannable QR code from any string value.',
      kind: 'Components/QR Code',
      imageUrl: qrCodeImage,
    },
  ],
  'Feedback & Status': [
    {
      name: 'Badge',
      description: 'Small status indicator for counts, states, or labels.',
      kind: 'Components/Badge',
      imageUrl: badgeImage,
    },
    {
      name: 'Callout',
      description: 'Highlights important information or warnings inline.',
      kind: 'Components/Callout',
      imageUrl: calloutImage,
    },
    {
      name: 'Progress Bar',
      description: 'Visualises task completion as a filled horizontal track.',
      kind: 'Components/Progress Bar',
      imageUrl: progressBarImage,
    },
    {
      name: 'Progress Ring',
      description: 'Displays progress as a circular arc for dashboards.',
      kind: 'Components/Progress Ring',
      imageUrl: progressRingImage,
    },
    {
      name: 'Skeleton',
      description: 'Placeholder shape that mimics content while it loads.',
      kind: 'Components/Skeleton',
      imageUrl: skeletonImage,
    },
    {
      name: 'Spinner',
      description: 'Rotating animation that indicates ongoing activity.',
      kind: 'Components/Spinner',
      imageUrl: spinnerImage,
    },
    {
      name: 'Tag',
      description: 'Compact label for categorising or annotating content.',
      kind: 'Components/Tag',
      imageUrl: tagImage,
    },
    {
      name: 'Toast',
      description:
        'Manages and stacks lightweight notification banners at a screen edge.',
      kind: 'Components/Toast',
      imageUrl: toastImage,
    },
    {
      name: 'Toast Item',
      description:
        'Single notification banner with variants, icons, and auto-dismiss.',
      kind: 'Components/Toast Item',
      imageUrl: toastItemImage,
    },
    {
      name: 'Tooltip',
      description:
        'Brief text label that appears near a trigger on hover or focus.',
      kind: 'Components/Tooltip',
      imageUrl: tooltipImage,
    },
  ],
  'Form Controls': [
    {
      name: 'Checkbox',
      description:
        'Binary toggle for a boolean value with indeterminate support.',
      kind: 'Components/Checkbox',
      imageUrl: checkboxImage,
    },
    {
      name: 'Color Picker',
      description:
        'Full-featured color selection with hue, saturation, and swatches.',
      kind: 'Components/Color Picker',
      imageUrl: colorPickerImage,
    },
    {
      name: 'Combobox',
      description: 'Text input combined with a filterable dropdown list.',
      kind: 'Components/Combobox',
      imageUrl: comboboxImage,
    },
    {
      name: 'File Input',
      description: 'Lets users select and upload one or more files.',
      kind: 'Components/File Input',
      imageUrl: fileInputImage,
    },
    {
      name: 'Input',
      description:
        'Single-line text entry supporting all standard HTML input types.',
      kind: 'Components/Input',
      imageUrl: inputImage,
    },
    {
      name: 'Number Input',
      description: 'Numeric input with increment and decrement controls.',
      kind: 'Components/Number Input',
      imageUrl: numberInputImage,
    },
    {
      name: 'Option',
      description:
        'Selectable item used inside Select, Combobox, and similar controls.',
      kind: 'Components/Option',
      imageUrl: optionImage,
    },
    {
      name: 'Radio',
      description: 'Single option in a mutually exclusive selection group.',
      kind: 'Components/Radio',
      imageUrl: radioImage,
    },
    {
      name: 'Radio Group',
      description:
        'Manages a set of Radio options with shared selection state.',
      kind: 'Components/Radio Group',
      imageUrl: radioGroupImage,
    },
    {
      name: 'Rating',
      description: 'Captures a numeric score via a row of star symbols.',
      kind: 'Components/Rating',
      imageUrl: ratingImage,
    },
    {
      name: 'Select',
      description:
        'Dropdown list of Option children for single or multiple selection.',
      kind: 'Components/Select',
      imageUrl: selectImage,
    },
    {
      name: 'Slider',
      description: 'Selects a numeric value by dragging a thumb along a track.',
      kind: 'Components/Slider',
      imageUrl: sliderImage,
    },
    {
      name: 'Switch',
      description: 'Toggle that represents an immediate on/off boolean state.',
      kind: 'Components/Switch',
      imageUrl: switchImage,
    },
    {
      name: 'Textarea',
      description:
        'Multi-line text entry with configurable resize and auto-grow.',
      kind: 'Components/Textarea',
      imageUrl: textareaImage,
    },
  ],
  Imagery: [
    {
      name: 'Animated Image',
      description:
        'Displays animated GIFs and WebPs with user-controlled playback.',
      kind: 'Components/Animated Image',
      imageUrl: animatedImageImage,
    },
    {
      name: 'Avatar',
      description:
        'Represents a person with an image, initials, or icon fallback.',
      kind: 'Components/Avatar',
      imageUrl: avatarImage,
    },
    {
      name: 'Carousel',
      description:
        'Scrollable slide sequence with navigation arrows and pagination.',
      kind: 'Components/Carousel',
      imageUrl: carouselImage,
    },
    {
      name: 'Carousel Item',
      description: 'A single slide container within a Carousel.',
      kind: 'Components/Carousel Item',
      imageUrl: carouselItemImage,
    },
    {
      name: 'Comparison',
      description: 'Before/after image viewer with a draggable divider.',
      kind: 'Components/Comparison',
      imageUrl: comparisonImage,
    },
    {
      name: 'Icon',
      description: 'Scalable vector symbol from the Web Awesome icon set.',
      kind: 'Components/Icon',
      imageUrl: iconImage,
    },
    {
      name: 'Zoomable Frame',
      description:
        'Iframe with built-in zoom controls and discrete zoom levels.',
      kind: 'Components/Zoomable Frame',
      imageUrl: zoomableFrameImage,
    },
  ],
  Navigation: [
    {
      name: 'Breadcrumb',
      description:
        'Trail of navigational links showing the current page hierarchy.',
      kind: 'Components/Breadcrumb',
      imageUrl: breadcrumbImage,
    },
    {
      name: 'Breadcrumb Item',
      description: 'Individual link or label within a Breadcrumb component.',
      kind: 'Components/Breadcrumb Item',
      imageUrl: breadcrumbItemImage,
    },
    {
      name: 'Tab',
      description:
        'Navigation trigger linked to a Tab Panel inside a Tab Group.',
      kind: 'Components/Tab',
      imageUrl: tabImage,
    },
    {
      name: 'Tab Group',
      description:
        'Orchestrates Tab and Tab Panel components with active-state management.',
      kind: 'Components/Tab Group',
      imageUrl: tabGroupImage,
    },
    {
      name: 'Tab Panel',
      description: 'Content container shown when its associated Tab is active.',
      kind: 'Components/Tab Panel',
      imageUrl: tabPanelImage,
    },
    {
      name: 'Tree',
      description:
        'Hierarchical list with expandable nodes and single/multi selection.',
      kind: 'Components/Tree',
      imageUrl: treeImage,
    },
    {
      name: 'Tree Item',
      description:
        'A node in a Tree with expand, select, disable, and lazy-load support.',
      kind: 'Components/Tree Item',
      imageUrl: treeItemImage,
    },
  ],
  Organization: [
    {
      name: 'Card',
      description:
        'Versatile container grouping related content with header, body, and footer.',
      kind: 'Components/Card',
      imageUrl: cardImage,
    },
    {
      name: 'Details',
      description:
        'Collapsible disclosure widget with a summary trigger and expandable body.',
      kind: 'Components/Details',
      imageUrl: detailsImage,
    },
    {
      name: 'Dialog',
      description:
        'Modal overlay with focus trapping for confirmations and forms.',
      kind: 'Components/Dialog',
      imageUrl: dialogImage,
    },
    {
      name: 'Divider',
      description:
        'Thin horizontal or vertical rule for separating content sections.',
      kind: 'Components/Divider',
      imageUrl: dividerImage,
    },
    {
      name: 'Drawer',
      description: 'Panel that slides in from any edge of the viewport.',
      kind: 'Components/Drawer',
      imageUrl: drawerImage,
    },
    {
      name: 'Page',
      description:
        'Application shell with header, side navigation, content, and footer.',
      kind: 'Components/Page',
      imageUrl: pageImage,
    },
    {
      name: 'Scroller',
      description:
        'Scrollable container with edge shadow indicators for overflow.',
      kind: 'Components/Scroller',
      imageUrl: scrollerImage,
    },
    {
      name: 'Split Panel',
      description: 'Two resizable panes separated by a draggable divider.',
      kind: 'Components/Split Panel',
      imageUrl: splitPanelImage,
    },
  ],
  'Data Display': [
    {
      name: 'Chart',
      description:
        'Renders interactive visualisations such as bars, lines, pies, and more.',
      kind: 'Components/Chart',
      imageUrl: chartImage,
    },
    {
      name: 'Sparkline',
      description:
        'Compact inline chart for visualising data trends at a glance.',
      kind: 'Components/Sparkline',
      imageUrl: sparklineImage,
    },
    {
      name: 'Bar Chart',
      description:
        'Displays categorical data as horizontal or vertical rectangular bars scaled to their values.',
      kind: 'Components/Bar Chart',
      imageUrl: barChartImage,
    },
    {
      name: 'Bubble Chart',
      description:
        'Plots three-dimensional data using position and circle size to encode a third variable.',
      kind: 'Components/Bubble Chart',
      imageUrl: bubbleChartImage,
    },
    {
      name: 'Doughnut Chart',
      description:
        'Shows proportional segments in a ring shape with an open center for summary content.',
      kind: 'Components/Doughnut Chart',
      imageUrl: doughnutChartImage,
    },
    {
      name: 'Line Chart',
      description:
        'Connects sequential data points to reveal trends and patterns over a continuous axis.',
      kind: 'Components/Line Chart',
      imageUrl: lineChartImage,
    },
    {
      name: 'Pie Chart',
      description:
        "Divides a circle into wedges that represent each category's share of the whole.",
      kind: 'Components/Pie Chart',
      imageUrl: pieChartImage,
    },
    {
      name: 'Polar Area Chart',
      description:
        'Arranges segments of equal angle but varying radius around a central point.',
      kind: 'Components/Polar Area Chart',
      imageUrl: polarAreaChartImage,
    },
    {
      name: 'Radar Chart',
      description:
        'Maps multiple variables onto radial axes to compare profiles at a glance.',
      kind: 'Components/Radar Chart',
      imageUrl: radarChartImage,
    },
    {
      name: 'Scatter Chart',
      description:
        'Positions individual data points by two numeric axes to expose correlations.',
      kind: 'Components/Scatter Chart',
      imageUrl: scatterChartImage,
    },
  ],
  Utilities: [
    {
      name: 'Animation',
      description:
        'Plays named keyframe animations from the Web Animations API.',
      kind: 'Components/Animation',
      imageUrl: animationImage,
    },
    {
      name: 'Format Bytes',
      description:
        'Converts a byte count to a human-readable string (KB, MB, GB).',
      kind: 'Components/Format Bytes',
      imageUrl: formatBytesImage,
    },
    {
      name: 'Format Date',
      description: 'Formats a date-time value using Intl.DateTimeFormat.',
      kind: 'Components/Format Date',
      imageUrl: formatDateImage,
    },
    {
      name: 'Format Number',
      description:
        'Formats numbers with Intl.NumberFormat for currency, percent, and more.',
      kind: 'Components/Format Number',
      imageUrl: formatNumberImage,
    },
    {
      name: 'Include',
      description: 'Fetches and injects external HTML content into the page.',
      kind: 'Components/Include',
      imageUrl: includeImage,
    },
    {
      name: 'Intersection Observer',
      description:
        'Fires events when an element enters or leaves the viewport.',
      kind: 'Components/Intersection Observer',
      imageUrl: intersectionObserverImage,
    },
    {
      name: 'Mutation Observer',
      description: 'Declarative wrapper around the MutationObserver API.',
      kind: 'Components/Mutation Observer',
      imageUrl: mutationObserverImage,
    },
    {
      name: 'Popover',
      description:
        'Rich floating panel anchored to a trigger with auto-positioning.',
      kind: 'Components/Popover',
      imageUrl: popoverImage,
    },
    {
      name: 'Popup',
      description: 'Low-level positioning primitive built on Floating UI.',
      kind: 'Components/Popup',
      imageUrl: popupImage,
    },
    {
      name: 'Relative Time',
      description:
        'Formats a date as a locale-aware relative string (e.g. "3 minutes ago").',
      kind: 'Components/Relative Time',
      imageUrl: relativeTimeImage,
    },
    {
      name: 'Resize Observer',
      description: 'Declarative wrapper around the ResizeObserver API.',
      kind: 'Components/Resize Observer',
      imageUrl: resizeObserverImage,
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
        <div className="wa-frame:landscape" slot="media">
          <img alt={c.name} src={c.imageUrl} loading="lazy" decoding="async" />
        </div>
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
