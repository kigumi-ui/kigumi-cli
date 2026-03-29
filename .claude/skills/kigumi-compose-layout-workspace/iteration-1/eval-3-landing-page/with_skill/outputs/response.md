# Landing Page Layout

## Layout Diagram

```
+------------------------------------------+
|  .wa-dark  Hero Section                  |
|  Title (wa-heading-2xl)                  |
|  Subtitle (wa-body-l)                    |
|  [CTA Button]                            |
+------------------------------------------+
|      Features: .wa-grid (3 cols)         |
|  [Card]     [Card]     [Card]            |
+------------------------------------------+
|  Footer: .wa-split                       |
|  (c) Brand          [Link] [Link] [Link] |
+------------------------------------------+
```

## Install Missing Components

Both React and Vue starter repos already have `Button`, `Card`, `Icon`, and `Divider` installed. No additional installs are needed.

If starting from scratch, run:

```bash
npx kigumi add button card icon divider
```

## React Implementation

```tsx
import { Button, Card, Divider, Icon } from '@/components/ui';

const features = [
  {
    icon: 'bolt',
    title: 'Lightning Fast',
    description:
      'Optimized components that load in milliseconds, keeping your app snappy.',
  },
  {
    icon: 'palette',
    title: 'Fully Themeable',
    description:
      'CSS custom properties give you complete control over every design token.',
  },
  {
    icon: 'universal-access',
    title: 'Accessible by Default',
    description:
      'WCAG 2.1 AA compliance built into every component out of the box.',
  },
];

export function LandingPage() {
  return (
    <div className="wa-stack wa-gap-0">
      {/* Hero -- .wa-dark inverts all --wa-color-* tokens in this section */}
      <section
        className="wa-dark"
        style={{
          padding: 'var(--wa-space-4xl) var(--wa-space-l)',
          background: 'var(--wa-color-surface-default)',
        }}
      >
        <div
          className="wa-stack wa-gap-m wa-align-items-center"
          style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}
        >
          <h1
            className="wa-heading-2xl"
            style={{ color: 'var(--wa-color-text-normal)' }}
          >
            Ship polished UIs in record time
          </h1>
          <p
            className="wa-body-l"
            style={{ color: 'var(--wa-color-text-quiet)' }}
          >
            Production-ready components with built-in accessibility, theming,
            and responsive behavior. No config required.
          </p>
          <div className="wa-cluster wa-gap-s wa-justify-content-center">
            <Button variant="brand" size="large">
              Get Started
            </Button>
            <Button variant="neutral" size="large" appearance="outlined">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Features -- .wa-grid auto-wraps to fewer columns on narrow screens */}
      <section
        className="wa-stack wa-gap-l"
        style={{ padding: 'var(--wa-space-2xl) var(--wa-space-l)' }}
      >
        <h2 className="wa-heading-xl" style={{ textAlign: 'center' }}>
          Why teams choose us
        </h2>
        <div
          className="wa-grid"
          style={{ '--min-column-size': '280px' } as React.CSSProperties}
        >
          {features.map((f) => (
            <Card key={f.icon}>
              <div
                className="wa-stack wa-gap-s wa-align-items-center"
                style={{ textAlign: 'center', padding: 'var(--wa-space-m)' }}
              >
                <Icon
                  name={f.icon}
                  style={{ fontSize: '2rem', color: 'var(--wa-color-brand)' }}
                />
                <strong className="wa-heading-s">{f.title}</strong>
                <p
                  className="wa-body-m"
                  style={{ color: 'var(--wa-color-text-quiet)', margin: 0 }}
                >
                  {f.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Divider />
      <footer
        className="wa-split wa-align-items-center"
        style={{ padding: 'var(--wa-space-m) var(--wa-space-l)' }}
        aria-label="Site footer"
      >
        <small style={{ color: 'var(--wa-color-text-quiet)' }}>
          2026 Acme Inc.
        </small>
        <nav aria-label="Footer links">
          <div className="wa-cluster wa-gap-m">
            <a href="/about" className="wa-link">
              About
            </a>
            <a href="/privacy" className="wa-link">
              Privacy
            </a>
            <a href="/terms" className="wa-link">
              Terms
            </a>
          </div>
        </nav>
      </footer>
    </div>
  );
}
```

## Vue Implementation

```vue
<script setup lang="ts">
import { Button, Card, Divider, Icon } from '@/components/ui';

const features = [
  {
    icon: 'bolt',
    title: 'Lightning Fast',
    description:
      'Optimized components that load in milliseconds, keeping your app snappy.',
  },
  {
    icon: 'palette',
    title: 'Fully Themeable',
    description:
      'CSS custom properties give you complete control over every design token.',
  },
  {
    icon: 'universal-access',
    title: 'Accessible by Default',
    description:
      'WCAG 2.1 AA compliance built into every component out of the box.',
  },
];
</script>

<template>
  <div class="wa-stack wa-gap-0">
    <!-- Hero -- .wa-dark inverts all --wa-color-* tokens in this section -->
    <section
      class="wa-dark"
      style="
        padding: var(--wa-space-4xl) var(--wa-space-l);
        background: var(--wa-color-surface-default);
      "
    >
      <div
        class="wa-stack wa-gap-m wa-align-items-center"
        style="text-align: center; max-width: 680px; margin: 0 auto"
      >
        <h1 class="wa-heading-2xl" style="color: var(--wa-color-text-normal)">
          Ship polished UIs in record time
        </h1>
        <p class="wa-body-l" style="color: var(--wa-color-text-quiet)">
          Production-ready components with built-in accessibility, theming, and
          responsive behavior. No config required.
        </p>
        <div class="wa-cluster wa-gap-s wa-justify-content-center">
          <Button variant="brand" size="large">Get Started</Button>
          <Button variant="neutral" size="large" appearance="outlined">
            View Documentation
          </Button>
        </div>
      </div>
    </section>

    <!-- Features -- .wa-grid auto-wraps to fewer columns on narrow screens -->
    <section
      class="wa-stack wa-gap-l"
      style="padding: var(--wa-space-2xl) var(--wa-space-l)"
    >
      <h2 class="wa-heading-xl" style="text-align: center">
        Why teams choose us
      </h2>
      <div class="wa-grid" style="--min-column-size: 280px">
        <Card v-for="f in features" :key="f.icon">
          <div
            class="wa-stack wa-gap-s wa-align-items-center"
            style="text-align: center; padding: var(--wa-space-m)"
          >
            <Icon
              :name="f.icon"
              style="font-size: 2rem; color: var(--wa-color-brand)"
            />
            <strong class="wa-heading-s">{{ f.title }}</strong>
            <p
              class="wa-body-m"
              style="color: var(--wa-color-text-quiet); margin: 0"
            >
              {{ f.description }}
            </p>
          </div>
        </Card>
      </div>
    </section>

    <!-- Footer -->
    <Divider />
    <footer
      class="wa-split wa-align-items-center"
      style="padding: var(--wa-space-m) var(--wa-space-l)"
      aria-label="Site footer"
    >
      <small style="color: var(--wa-color-text-quiet)">2026 Acme Inc.</small>
      <nav aria-label="Footer links">
        <div class="wa-cluster wa-gap-m">
          <a href="/about" class="wa-link">About</a>
          <a href="/privacy" class="wa-link">Privacy</a>
          <a href="/terms" class="wa-link">Terms</a>
        </div>
      </nav>
    </footer>
  </div>
</template>
```

## Responsive Behavior

No `@media` queries are needed. The layout handles all breakpoints automatically:

| Viewport            | Hero                                 | Features Grid                                        | Footer                                |
| ------------------- | ------------------------------------ | ---------------------------------------------------- | ------------------------------------- |
| Desktop (>900px)    | Centered, generous `4xl` padding     | 3 columns side by side                               | Brand left, links right               |
| Tablet (~600-900px) | Same centered layout, padding scales | 2 columns (auto-wrap via `--min-column-size: 280px`) | Same split layout                     |
| Mobile (<600px)     | Same centered layout, tighter fit    | 1 column stacked                                     | Stacks vertically (`.wa-split` wraps) |

### Key layout decisions

- **`.wa-dark`** on the hero section auto-inverts all `--wa-color-*` tokens, producing a dark background with light text. No manual color overrides needed beyond `background: var(--wa-color-surface-default)`.
- **`.wa-grid` with `--min-column-size: 280px`** produces exactly 3 columns on typical desktop widths, wrapping to 2 then 1 as the viewport narrows.
- **`.wa-split`** in the footer pushes the brand name and navigation links to opposite ends. On very narrow screens, flex items wrap naturally.
- **Semantic HTML** throughout: `<section>` for content regions, `<footer>` with `aria-label`, `<nav>` with `aria-label` for the footer link group.
- **`.wa-cluster`** for the CTA button group and footer links, providing horizontal layout with automatic wrapping.
