# Enabling Dark Mode in a Kigumi React Project

Dark mode in Kigumi is controlled by toggling the `.wa-dark` CSS class on the `<html>` element. All Kigumi themes support dark mode out of the box -- no extra theme configuration or CSS is needed.

## How It Works

When `.wa-dark` is present on `<html>`, all `--wa-color-*` CSS variables automatically switch to their dark values. For example, `--wa-color-surface-default` changes from `white` to a dark neutral, and `--wa-color-text-normal` flips from near-black to near-white. This happens at the theme CSS level, so every component responds automatically.

## Toggle Component with Persistence

Here is a complete `ThemeToggle` component that persists the user's preference to `localStorage` and respects their OS-level preference on first visit:

```tsx
// src/components/ThemeToggle.tsx
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('wa-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('wa-dark', dark);
    localStorage.setItem('wa-dark-mode', String(dark));
  }, [dark]);

  return (
    <wa-switch checked={dark} onInput={() => setDark(!dark)}>
      Dark mode
    </wa-switch>
  );
}
```

### What this does

1. **Initial state**: Reads `localStorage` for a saved preference. If none exists, falls back to the OS-level `prefers-color-scheme: dark` media query.
2. **Toggle effect**: Adds or removes `.wa-dark` on `<html>` whenever the state changes, and saves the preference to `localStorage`.
3. **UI**: Uses a `<wa-switch>` component as the toggle control.

## Responding to OS Preference Changes

If you also want to react when the user changes their system theme (e.g., macOS auto dark mode at sunset), add a media query listener:

```tsx
useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    setDark(e.matches);
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

You can combine this with the localStorage logic above. Whether to let the OS override a manual toggle or not is a UX decision -- many apps only listen to the OS preference when no explicit user choice has been saved.

## Additional Mode Classes

Kigumi provides two more utility classes beyond `.wa-dark`:

- **`.wa-light`** -- Forces light mode on a subtree, even inside a dark ancestor. Useful for a light-themed card inside a dark page.
- **`.wa-invert`** -- Locally inverts the current mode. If the page is dark, an element with `.wa-invert` renders in light mode, and vice versa.

Example of local inversion:

```html
<html class="wa-dark">
  <body>
    <wa-card class="wa-invert">
      <!-- This card renders in light mode despite the dark page -->
    </wa-card>
  </body>
</html>
```

## Important Notes

- Use `.wa-dark`, not `.dark`. The `wa-` prefix is required.
- The class must be on `<html>` (i.e., `document.documentElement`), not on `<body>`.
- No changes to `kigumi.config.json` are needed for dark mode -- it works with any theme, palette, and brand color combination.
- If you have custom CSS variable overrides, make sure to provide `.wa-dark` variants for any color tokens you override. See the customization guide for examples.
