# Kigumi

CLI to add [Web Awesome](https://webawesome.com) components to your React project with type-safe wrappers.

> **Note:** Currently React-only. Vue, Angular, and Svelte support coming soon.

## Quick Start

```bash
npx kigumi init
npx kigumi add button card input
```

Import Web Awesome in your entry file:

```tsx
// src/main.tsx
import '@/lib/webawesome';
```

Use the components:

```tsx
import { Button, Card } from '@/components/ui';

function App() {
  return (
    <Card>
      <Button variant="brand">Click me</Button>
    </Card>
  );
}
```

## What You Get

Kigumi generates React wrappers for Web Awesome components with:

- **TypeScript support** - Full type definitions for all props
- **React-friendly events** - Web Awesome events mapped to React conventions (`onChange`, `onInput`, etc.)
- **Ref forwarding** - Access the underlying Web Component when needed
- **Copied to your project** - No external dependencies, customize as needed

## Commands

```bash
npx kigumi init              # Initialize project
npx kigumi add <component>   # Add component(s)
npx kigumi add               # Interactive component selection
npx kigumi add --all         # Add all components
npx kigumi list              # List available components
npx kigumi status            # Show current configuration
npx kigumi theme set <name>  # Change theme
npx kigumi palette <name>    # Change color palette
npx kigumi brand <color>     # Change brand color
```

**Brand colors:** blue, indigo, purple, pink, red, orange, yellow, green, cyan, gray

Non-interactive mode with `--yes`:

```bash
npx kigumi init --yes --framework react --typescript
npx kigumi add button card --yes
```

## Configuration

Settings in `kigumi.config.json`:

```json
{
  "framework": "react",
  "typescript": true,
  "componentsDir": "src/components/ui",
  "stylesDir": "src/styles",
  "theme": {
    "selected": "default",
    "palette": "default",
    "brandColor": "blue"
  }
}
```

## Customization

Kigumi generates `theme.css` in your configured `stylesDir` with documented examples for customizing your theme.

Override any [design token](https://webawesome.com/docs/tokens) in your CSS:

```css
:root {
  /* Brand color */
  --wa-color-brand-600: #6366f1;

  /* Typography */
  --wa-font-family-sans: 'Inter', system-ui, sans-serif;

  /* Border radius */
  --wa-border-radius-medium: 0.5rem;

  /* Spacing */
  --wa-spacing-medium: 1rem;
}
```

See the full customization guide: [webawesome.com/docs/customizing](https://webawesome.com/docs/customizing)

## Pro Tier

Access premium themes and components with a [Web Awesome Pro](https://webawesome.com) token:

```bash
npx kigumi init --token=YOUR_PRO_TOKEN
```

## Troubleshooting

**Components not rendering?**
Ensure `import '@/lib/webawesome'` is in your entry file.

**Path alias errors?**
Re-run `npx kigumi init` to reconfigure aliases.

## License

MIT
