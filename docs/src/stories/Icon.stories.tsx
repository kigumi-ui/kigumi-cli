import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Icon } from '@/components/ui';
import { registerIconLibrary } from '@awesome.me/webawesome-pro/dist/webawesome.js';

/* ---------------------------------------------------------------------------
 * Register alternative icon libraries for demo stories.
 * These are loaded from CDN and available via the `library` prop.
 * ------------------------------------------------------------------------- */

registerIconLibrary('lucide', {
  resolver: (name) =>
    `https://cdn.jsdelivr.net/npm/lucide-static@0.16.29/icons/${name}.svg`,
  mutator: (svg) =>
    svg.querySelectorAll('path').forEach((path) => {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
    }),
});

registerIconLibrary('material', {
  resolver: (name) => {
    const match = name.match(/^(.*?)(_(round|sharp))?$/);
    return `https://cdn.jsdelivr.net/npm/@material-icons/svg@1.0.5/svg/${match![1]}/${match![3] || 'outline'}.svg`;
  },
  mutator: (svg) => svg.setAttribute('fill', 'currentColor'),
});

/* ---------------------------------------------------------------------------
 * Shared layout helpers
 * ------------------------------------------------------------------------- */

const caption: React.CSSProperties = {
  fontSize: '0.75rem',
  marginTop: '0.25rem',
  color: 'var(--wa-color-neutral-text-normal)',
};

const smallCaption: React.CSSProperties = {
  fontSize: '0.625rem',
  marginTop: '0.25rem',
  color: 'var(--wa-color-neutral-text-normal)',
};

const row: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'center',
  fontSize: '2rem',
};

const gallery: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5rem',
  fontSize: '2rem',
};

/**
 * Icons are symbols used to represent actions, objects, and concepts in an interface.
 *
 * The default icon library is **Font Awesome** (2 000+ free icons). Browse available
 * names at [fontawesome.com/icons](https://fontawesome.com/icons).
 *
 * You can also register alternative icon libraries (Lucide, Material, Bootstrap, etc.)
 * via `registerIconLibrary()` and reference them with the `library` prop.
 * See the **Icon Libraries** story below for details.
 */
const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description:
        "Font Awesome icon name (e.g. 'star', 'house'). Browse at [fontawesome.com/icons](https://fontawesome.com/icons).",
    },
    library: {
      control: 'text',
      description:
        "Registered icon library name. Default uses Font Awesome. Register alternatives via `registerIconLibrary()` from `@awesome.me/webawesome-pro/dist/webawesome.js`.",
      table: { defaultValue: { summary: 'default' } },
    },
    src: { control: 'text', description: 'An external URL of an SVG file.' },
    label: {
      control: 'text',
      description:
        'Accessible label for assistive devices. Required for non-decorative icons.',
    },
    family: {
      control: 'select',
      options: ['classic', 'brands'],
      description:
        "Icon family. Free: 'classic', 'brands'. Pro adds 'sharp', 'duotone', 'sharp-duotone'.",
      table: { defaultValue: { summary: 'classic' } },
    },
    variant: {
      control: 'select',
      options: ['regular', 'solid'],
      description:
        "Icon weight. Free: 'regular', 'solid'. Pro adds 'thin', 'light'.",
      table: { defaultValue: { summary: 'regular' } },
    },
    'auto-width': {
      control: 'boolean',
      description:
        'Sets the width to match the cropped SVG viewBox instead of the fixed 1.25em.',
      table: { defaultValue: { summary: 'false' } },
    },
    'swap-opacity': {
      control: 'boolean',
      description:
        'Swaps the opacity of the primary and secondary layers in duotone icons.',
      table: { defaultValue: { summary: 'false' } },
    },
    rotate: {
      control: 'number',
      description: 'Rotate the icon by this many degrees.',
    },
    flip: {
      control: 'select',
      options: ['horizontal', 'vertical', 'both'],
      description: 'Mirror the icon along the horizontal, vertical, or both axes.',
    },
    animation: {
      control: 'select',
      options: [
        'beat',
        'fade',
        'beat-fade',
        'bounce',
        'flip',
        'shake',
        'spin',
        'spin-pulse',
        'spin-reverse',
      ],
      description:
        'Built-in animation preset. Loops continuously. Respects `prefers-reduced-motion`.',
    },
    onLoad: {
      action: 'load',
      description:
        'Emitted when the icon has loaded. Does not emit when using `spriteSheet: true`.',
      table: { category: 'Events' },
    },
    onError: {
      action: 'error',
      description:
        'Emitted when the icon fails to load. Does not emit when using `spriteSheet: true`.',
      table: { category: 'Events' },
    },
  },
  args: {
    onLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------------------
 * Stories
 * ------------------------------------------------------------------------- */

/** A single icon at the default (inherited) size. Icons are sourced from Font Awesome by default. */
export const Default: Story = {
  args: { name: 'star', style: { fontSize: '2rem' } },
};

/** The free icon weight variants: regular (default) and solid. Pro adds thin and light. */
export const Variants: Story = {
  render: () => (
    <div style={row}>
      {(['regular', 'solid'] as const).map((v) => (
        <div key={v} style={{ textAlign: 'center' }}>
          <Icon name="heart" variant={v} />
          <div style={caption}>{v}</div>
        </div>
      ))}
    </div>
  ),
};

/** A gallery of common interface icons. All names come from the Font Awesome icon set. */
export const CommonIcons: Story = {
  render: () => {
    const icons = [
      'house',
      'user',
      'envelope',
      'bell',
      'gear',
      'search',
      'plus',
      'xmark',
      'check',
      'trash',
      'pencil',
      'eye',
      'lock',
      'heart',
      'star',
    ];
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          fontSize: '1.5rem',
        }}
      >
        {icons.map((name) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <Icon name={name} />
            <div style={smallCaption}>{name}</div>
          </div>
        ))}
      </div>
    );
  },
};

/** Icons inherit their size from `font-size`. Scale them by setting `fontSize` on the element or a parent. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Icon name="star" style={{ fontSize: '1rem' }} />
      <Icon name="star" style={{ fontSize: '1.5rem' }} />
      <Icon name="star" style={{ fontSize: '2rem' }} />
      <Icon name="star" style={{ fontSize: '3rem' }} />
      <Icon name="star" style={{ fontSize: '5rem' }} />
    </div>
  ),
};

/**
 * Nine built-in animation presets. Animations loop continuously and respect
 * `prefers-reduced-motion`. Customize timing via CSS custom properties like
 * `--animation-duration`, `--animation-delay`, `--beat-scale`, `--bounce-height`, etc.
 */
export const Animations: Story = {
  render: () => {
    const animations = [
      'beat',
      'fade',
      'beat-fade',
      'bounce',
      'flip',
      'shake',
      'spin',
      'spin-pulse',
      'spin-reverse',
    ] as const;
    return (
      <div style={gallery}>
        {animations.map((anim) => (
          <div key={anim} style={{ textAlign: 'center' }}>
            <Icon name="heart" variant="solid" animation={anim} />
            <div style={caption}>{anim}</div>
          </div>
        ))}
      </div>
    );
  },
};

/** Flip mirrors the icon along an axis. Rotate turns it by arbitrary degrees. */
export const FlipAndRotate: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        fontSize: '2rem',
      }}
    >
      <div>
        <div style={{ ...caption, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          Flip
        </div>
        <div style={row}>
          <div style={{ textAlign: 'center' }}>
            <Icon name="arrow-right" />
            <div style={caption}>default</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Icon name="arrow-right" flip="horizontal" />
            <div style={caption}>horizontal</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Icon name="arrow-right" flip="vertical" />
            <div style={caption}>vertical</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Icon name="arrow-right" flip="both" />
            <div style={caption}>both</div>
          </div>
        </div>
      </div>
      <div>
        <div style={{ ...caption, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          Rotate
        </div>
        <div style={row}>
          {[0, 90, 180, 270].map((deg) => (
            <div key={deg} style={{ textAlign: 'center' }}>
              <Icon name="arrow-right" rotate={deg} />
              <div style={caption}>{deg}&deg;</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/** Brand and logo icons use the `brands` family. These include company logos and social media icons from Font Awesome. */
export const BrandIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '2rem' }}>
      <Icon name="github" family="brands" label="GitHub" />
      <Icon name="twitter" family="brands" label="Twitter" />
      <Icon name="linkedin" family="brands" label="LinkedIn" />
      <Icon name="react" family="brands" label="React" />
    </div>
  ),
};

/**
 * The Icon component is not limited to Font Awesome. You can register any SVG icon library
 * via `registerIconLibrary()` and reference it with the `library` prop.
 *
 * **Pre-configured libraries** (registration code in [Web Awesome docs](https://webawesome.com/docs/components/icon#icon-libraries)):
 *
 * | Library | License | Style |
 * |---------|---------|-------|
 * | Bootstrap Icons | MIT | Fill-based, two families (regular, filled) |
 * | Boxicons | CC 4.0 | Regular, solid, logos |
 * | Heroicons | MIT | Stroke-based outlines |
 * | Iconoir | MIT | Stroke-based |
 * | Ionicons | MIT | Outline, filled, sharp |
 * | Jam Icons | MIT | Regular and filled |
 * | Lucide | MIT | Stroke-based (Feather fork) |
 * | Material Icons | Apache 2.0 | Outline, round, sharp |
 * | Remix Icon | Apache 2.0 | Line and fill, categorized |
 * | Tabler Icons | MIT | 1 950+ stroke-based icons |
 * | Unicons | Apache 2.0 | Line and solid |
 *
 * **Registration API:**
 * ```ts
 * import { registerIconLibrary } from '@awesome.me/webawesome-pro/dist/webawesome.js';
 *
 * registerIconLibrary('my-lib', {
 *   resolver: (name, family, variant) => `/icons/${name}.svg`,
 *   mutator: (svg) => svg.setAttribute('fill', 'currentColor'),
 *   spriteSheet: false, // set true for self-hosted sprite sheets
 * });
 * ```
 *
 * You can also override the default library by registering with the name `'default'`,
 * or load a one-off SVG via the `src` prop.
 */
export const IconLibraries: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        fontSize: '2rem',
      }}
    >
      {(
        [
          {
            lib: undefined,
            label: 'Font Awesome (default)',
            icons: ['house', 'heart', 'magnifying-glass', 'gear'],
          },
          {
            lib: 'lucide',
            label: 'Lucide',
            icons: ['home', 'heart', 'search', 'settings'],
          },
          {
            lib: 'material',
            label: 'Material Icons',
            icons: ['home', 'favorite', 'search', 'settings'],
          },
        ] as const
      ).map(({ lib, label, icons }) => (
        <div key={label}>
          <div
            style={{
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              color: 'var(--wa-color-neutral-text-normal)',
            }}
          >
            {label}
          </div>
          <div style={row}>
            {icons.map((name) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <Icon name={name} library={lib} />
                <div style={caption}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      {/* Variants */}
      <div style={row}>
        {(['regular', 'solid'] as const).map((v) => (
          <div key={v} style={{ textAlign: 'center' }}>
            <Icon name="heart" variant={v} />
            <div style={{ fontSize: '0.75rem' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Sizes */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Icon name="star" style={{ fontSize: '1rem' }} />
        <Icon name="star" style={{ fontSize: '1.5rem' }} />
        <Icon name="star" style={{ fontSize: '2rem' }} />
        <Icon name="star" style={{ fontSize: '3rem' }} />
      </div>

      {/* Flip & Rotate */}
      <div style={row}>
        <Icon name="arrow-right" />
        <Icon name="arrow-right" flip="horizontal" />
        <Icon name="arrow-right" flip="vertical" />
        <Icon name="arrow-right" rotate={90} />
        <Icon name="arrow-right" rotate={180} />
      </div>

      {/* Brands */}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '2rem' }}>
        <Icon name="github" family="brands" label="GitHub" />
        <Icon name="twitter" family="brands" label="Twitter" />
        <Icon name="react" family="brands" label="React" />
      </div>

      {/* Alternative libraries */}
      <div style={row}>
        <Icon name="home" library="lucide" />
        <Icon name="heart" library="lucide" />
        <Icon name="home" library="material" />
        <Icon name="favorite" library="material" />
      </div>
    </div>
  ),
};
