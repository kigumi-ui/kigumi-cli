# Enabling Dark Mode in a Kigumi React Project

## How Dark Mode Works

Kigumi (via Web Awesome) activates dark mode by toggling the `.wa-dark` CSS class on the `<html>` element. When `.wa-dark` is present, all `--wa-*` CSS custom properties automatically switch to their dark values -- surface colors invert, text colors lighten, and semantic variants adjust. No extra CSS imports or theme files are needed; every Kigumi theme supports dark mode out of the box.

Key classes:

| Class        | Purpose                                           |
| ------------ | ------------------------------------------------- |
| `.wa-dark`   | Activates dark mode                               |
| `.wa-light`  | Forces light mode (useful inside a dark ancestor) |
| `.wa-invert` | Locally inverts the current mode for a subtree    |

## Implementation: Toggle with Persisted Preference

Create a `ThemeToggle` component that:

1. Reads the user's saved preference from `localStorage` on mount.
2. Falls back to the OS-level `prefers-color-scheme` media query when no saved preference exists.
3. Toggles `.wa-dark` on `<html>` whenever the state changes.
4. Persists the choice to `localStorage`.
5. Listens for OS-level preference changes so the UI stays in sync if the user changes their system setting while no explicit preference is saved.

```tsx
// src/components/ThemeToggle.tsx
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wa-dark-mode';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    // 1. Check localStorage for a saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === 'true';
    // 2. Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Toggle the .wa-dark class and persist to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('wa-dark', dark);
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]);

  // Listen for OS-level color scheme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only follow OS preference if user hasn't manually toggled
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) {
        setDark(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <wa-switch checked={dark} onInput={() => setDark(!dark)}>
      Dark mode
    </wa-switch>
  );
}
```

### Usage

Import and place the toggle anywhere in your app:

```tsx
// src/App.tsx
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

No changes to `layers.css`, `kigumi.config.json`, or any other file are required.

## What Happens Under the Hood

When `.wa-dark` is added to `<html>`, Web Awesome's theme CSS activates the dark-mode selectors. For example, the default theme defines:

| Token                        | Light Value                  | Dark Value (`.wa-dark`)      |
| ---------------------------- | ---------------------------- | ---------------------------- |
| `--wa-color-surface-default` | `white`                      | `var(--wa-color-neutral-05)` |
| `--wa-color-surface-raised`  | `white`                      | `var(--wa-color-neutral-10)` |
| `--wa-color-text-normal`     | `var(--wa-color-neutral-10)` | `var(--wa-color-neutral-95)` |
| `--wa-color-text-quiet`      | `var(--wa-color-neutral-40)` | `var(--wa-color-neutral-60)` |
| `--wa-color-brand-fill-loud` | `var(--wa-color-brand-50)`   | `var(--wa-color-brand-50)`   |

Every Kigumi component that uses these tokens automatically adapts.

## Customizing Dark Mode Colors

If the default dark palette does not match your brand, override specific tokens inside `@layer wa-theme-overrides` scoped to `.wa-dark`:

```css
/* src/styles/theme.css */
@layer wa-theme-overrides {
  .wa-dark {
    --wa-color-surface-default: #0f172a;
    --wa-color-surface-raised: #1e293b;
    --wa-color-surface-lowered: #020617;
    --wa-color-surface-border: #334155;

    --wa-color-text-normal: #f8fafc;
    --wa-color-text-quiet: #94a3b8;
  }
}
```

Import this file after `layers.css` in your entry point:

```tsx
// src/main.tsx
import './lib/layers.css'; // Kigumi theme (first)
import './styles/theme.css'; // Your overrides (second)
```

## Preventing Flash of Wrong Theme (FOWT)

To avoid a brief flash of light mode on page load before React hydrates, add a blocking script in your `index.html` `<head>`:

```html
<script>
  (function () {
    var saved = localStorage.getItem('wa-dark-mode');
    var prefersDark =
      saved !== null
        ? saved === 'true'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) document.documentElement.classList.add('wa-dark');
  })();
</script>
```

This runs synchronously before the page renders, so the correct theme is applied immediately.

## Local Inversion

You can invert a single section without changing the global mode. This is useful for creating contrast, such as a dark footer on an otherwise light page:

```tsx
<wa-card class="wa-invert">
  {/* This card renders in the opposite mode */}
</wa-card>
```

## Troubleshooting

**Dark mode toggle has no effect:**

- Verify the class being toggled is `.wa-dark` (not `.dark` or `data-theme="dark"`).
- Inspect `<html>` in DevTools to confirm the class is present.
- Confirm `layers.css` is imported in your entry point.

**Colors look wrong in dark mode:**

- Check that any custom CSS overrides include `.wa-dark` selectors for the dark variants.
- Open DevTools, inspect an element, and look at the computed `--wa-color-surface-default` to verify it switched.

**Flash of light mode on page load:**

- Add the blocking `<script>` in `<head>` as shown above.
- Make sure the script runs before any stylesheet or React bundle.
