# Dark Mode in a Kigumi React Project

## How dark mode works in Web Awesome / Kigumi

Web Awesome uses the CSS class `.wa-dark` to activate dark mode. When this class is present on an element (typically `<html>` or `<body>`), all Web Awesome components inside it switch to their dark-mode token values automatically. No separate CSS imports are needed -- dark tokens are already bundled in the theme files loaded via `src/styles/layers.css`.

## Step 1: Install the Switch component

If you don't already have it:

```bash
npx kigumi add switch
```

## Step 2: Create a `useDarkMode` hook

Create `src/hooks/useDarkMode.ts`:

```ts
import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('color-scheme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('wa-dark');
    } else {
      html.classList.remove('wa-dark');
    }
    localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, setIsDark };
}
```

Key points:

- Reads the persisted preference from `localStorage` on first render.
- Falls back to the OS-level `prefers-color-scheme` media query when no stored preference exists.
- Applies or removes `.wa-dark` on `<html>` -- the correct scope for global dark mode.
- Writes the choice back to `localStorage` on every change so it survives page reloads.

## Step 3: Add a toggle to your app

In `src/App.tsx` (or any layout component):

```tsx
import { Switch } from '@/components/ui';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function App() {
  const { isDark, setIsDark } = useDarkMode();

  return (
    <div>
      <Switch
        checked={isDark}
        onChange={(e) => setIsDark((e.target as HTMLInputElement).checked)}
      >
        Dark mode
      </Switch>

      {/* rest of your app */}
    </div>
  );
}
```

The `Switch` component from Kigumi wraps `<wa-switch>`. The `onChange` handler receives a native DOM `change` event; read the checked state from `e.target.checked`, not from a `CustomEvent` detail.

## Step 4: Prevent flash of wrong theme (optional but recommended)

Add an inline script to your `index.html` **before** any other scripts so the class is set synchronously before first paint:

```html
<script>
  (function () {
    var stored = localStorage.getItem('color-scheme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('wa-dark');
    }
  })();
</script>
```

Place it inside `<head>` in `index.html`, before the Vite module script tag.

## Step 5: Customize dark-mode tokens (optional)

Override any `--wa-*` token specifically for dark mode in `src/styles/theme.css`:

```css
.wa-dark {
  --wa-color-surface-default: oklch(0.15 0.01 280);
  --wa-color-text-normal: oklch(0.95 0 0);
}
```

These overrides live inside the `theme` cascade layer (handled by `layers.css`), so they automatically beat the Web Awesome base values without `!important`.

## Summary

| Step                          | What it does                                                       |
| ----------------------------- | ------------------------------------------------------------------ |
| `useDarkMode` hook            | Reads localStorage + OS preference, applies `.wa-dark` to `<html>` |
| `Switch` component            | Provides the accessible toggle UI                                  |
| `onChange` handler            | Reads `e.target.checked` (native DOM event, not CustomEvent)       |
| `localStorage`                | Persists the user's choice across sessions                         |
| Inline script in `index.html` | Eliminates flash of wrong theme on page load                       |
| `theme.css` overrides         | Custom dark-mode token values if needed                            |
