# Landing Page with Kigumi Components

## Setup

Install the required Kigumi component:

```bash
npx kigumi add button
```

## Component Code

### `LandingPage.tsx`

```tsx
import { Button } from '@/components/ui/button';

export function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section class="wa-dark hero">
        <div class="wa-stack hero__content">
          <h1 className="hero__title">Build Better Design Systems</h1>
          <p className="hero__subtitle">
            A modern toolkit for creating accessible, scalable component
            libraries that your whole team will love.
          </p>
          <div>
            <Button variant="primary" size="large">
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="features">
        <div class="wa-stack features__content">
          <h2 className="features__heading">Features</h2>
          <div class="wa-grid features__grid">
            <div class="wa-stack feature-card">
              <h3>Accessible by Default</h3>
              <p>
                Every component meets WCAG 2.1 AA standards out of the box.
                Keyboard navigation, screen reader support, and focus management
                are built in.
              </p>
            </div>
            <div class="wa-stack feature-card">
              <h3>Token-Driven Theming</h3>
              <p>
                Customize everything through CSS custom properties. Swap themes,
                adjust spacing, and change colors without touching component
                code.
              </p>
            </div>
            <div class="wa-stack feature-card">
              <h3>Framework Agnostic</h3>
              <p>
                Built on web components with first-class React, Vue, Svelte, and
                Angular wrappers. Use the same design system everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="footer">
        <div class="wa-split footer__content">
          <p className="footer__copyright">&copy; 2026 Acme Inc.</p>
          <nav class="wa-cluster footer__links">
            <a href="/docs">Documentation</a>
            <a href="/github">GitHub</a>
            <a href="/blog">Blog</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
```

### `LandingPage.css`

```css
/* Hero Section */
.hero {
  padding: var(--wa-spacing-4x-large) var(--wa-spacing-large);
  text-align: center;
}

.hero__content {
  max-width: 48rem;
  margin-inline: auto;
  --wa-stack-gap: var(--wa-spacing-large);
}

.hero__title {
  font-size: var(--wa-font-size-3x-large);
  font-weight: var(--wa-font-weight-bold);
  line-height: 1.1;
  margin: 0;
}

.hero__subtitle {
  font-size: var(--wa-font-size-large);
  opacity: 0.85;
  max-width: 36rem;
  margin-inline: auto;
}

/* Features Section */
.features {
  padding: var(--wa-spacing-4x-large) var(--wa-spacing-large);
}

.features__content {
  max-width: 64rem;
  margin-inline: auto;
  --wa-stack-gap: var(--wa-spacing-2x-large);
}

.features__heading {
  text-align: center;
  font-size: var(--wa-font-size-2x-large);
  margin: 0;
}

.features__grid {
  --wa-grid-min-column-size: 18rem;
  --wa-grid-gap: var(--wa-spacing-x-large);
}

.feature-card {
  padding: var(--wa-spacing-large);
  border: 1px solid var(--wa-color-neutral-200);
  border-radius: var(--wa-border-radius-large);
  --wa-stack-gap: var(--wa-spacing-small);
}

.feature-card h3 {
  font-size: var(--wa-font-size-large);
  margin: 0;
}

.feature-card p {
  color: var(--wa-color-neutral-600);
  margin: 0;
}

/* Footer */
.footer {
  padding: var(--wa-spacing-large);
  border-top: 1px solid var(--wa-color-neutral-200);
}

.footer__content {
  max-width: 64rem;
  margin-inline: auto;
}

.footer__copyright {
  margin: 0;
  color: var(--wa-color-neutral-500);
}

.footer__links {
  --wa-cluster-gap: var(--wa-spacing-large);
}

.footer__links a {
  color: var(--wa-color-neutral-600);
  text-decoration: none;
}

.footer__links a:hover {
  color: var(--wa-color-neutral-900);
  text-decoration: underline;
}
```

## Layout Utilities Used

| Utility       | Where                                         | Purpose                                                |
| ------------- | --------------------------------------------- | ------------------------------------------------------ |
| `.wa-dark`    | Hero section                                  | Inverts to dark color scheme for the hero              |
| `.wa-stack`   | Hero content, features content, feature cards | Vertical stacking with consistent gap                  |
| `.wa-grid`    | Features grid                                 | Responsive 3-column grid (collapses on narrow screens) |
| `.wa-split`   | Footer                                        | Pushes copyright left and links right                  |
| `.wa-cluster` | Footer links                                  | Horizontal wrapping row of links                       |

## How It Works

1. **Dark Hero**: The `.wa-dark` class on the hero `<section>` inverts the color scheme, giving a dark background with light text automatically through Web Awesome's color tokens.

2. **Responsive Features Grid**: `.wa-grid` with `--wa-grid-min-column-size: 18rem` creates a 3-column layout that collapses to 2 or 1 column on smaller screens without media queries.

3. **Footer Layout**: `.wa-split` pushes the copyright and navigation to opposite ends. `.wa-cluster` keeps the nav links in a horizontal row that wraps naturally.

4. **Spacing**: All spacing uses `--wa-spacing-*` tokens for consistency with the design system.
