# Kigumi CLI

> CLI tool to add Web Awesome components to your React, Vue, or Svelte project

Inspired by [shadcn/ui](https://ui.shadcn.com), Kigumi provides a seamless way to integrate Web Awesome components into your existing projects with framework-specific wrappers.

## Features

- 🎯 **Framework Support**: React (Vue and Svelte coming soon)
- 📦 **Component Registry**: Easy access to Web Awesome components
- 🎨 **Theme System**: Full theme support with CLI commands
- 🎭 **3 Pre-built Themes**: default, awesome, shoelace
- 🌈 **10 Brand Colors**: blue, purple, green, red, orange, yellow, cyan, indigo, pink, gray
- ⚡ **Hot Reload**: Theme changes apply instantly
- 🔧 **Auto-Detection**: Automatically detects your project setup
- 📝 **TypeScript First**: Full TypeScript support with auto-generated types
- ✨ **User Overrides**: Customize design tokens via CSS custom properties

## Quick Start

### Initialize in your project

```bash
npx @kigumi/cli init
```

This will:
- Detect your framework and setup
- Create a `kigumi-components.json` configuration file
- Set up directory structure
- Create a theme file with CSS custom properties
- Add `WA_TOKEN` to your `.env` file

### Add components

```bash
# Add a single component
npx kigumi add button

# Add multiple components
npx kigumi add button input card

# Interactive selection
npx kigumi add

# Add all components
npx kigumi add --all
```

### List available components

```bash
npx kigumi list
```

## Configuration

After running `init`, you'll have a `kigumi-components.json` file:

```json
{
  "framework": "react",
  "typescript": true,
  "componentsDir": "src/components/ui",
  "utilsDir": "src/lib",
  "theme": {
    "cssVars": true,
    "selected": "awesome",
    "palette": "default",
    "brandColor": "purple"
  },
  "aliases": {
    "@/components": "./src/components",
    "@/lib": "./src/lib",
    "@/styles": "./src/styles"
  },
  "webAwesome": {
    "tier": "free",
    "version": "^3.1.0"
  }
}
```

## Theme Customization

Customize components by overriding Web Awesome design tokens in `src/styles/theme.css`:

```css
/**
 * Web Awesome Theme Customizations
 *
 * Override Web Awesome design tokens here.
 * This file is imported AFTER the theme CSS, so your values take precedence.
 */

:root {
  /* Example: Customize spacing */
  --wa-space-xs: 0.25rem;
  --wa-space-s: 0.5rem;
  --wa-space-m: 1rem;

  /* Example: Customize typography */
  --wa-font-size-s: 0.875rem;
  --wa-font-weight-bold: 700;

  /* Example: Customize brand color (advanced) */
  --wa-color-brand-fill-loud: #your-custom-color;
}
```

For all available design tokens, see the [Web Awesome documentation](https://webawesome.com/docs/tokens).

## Usage Example

After adding components:

```tsx
import { Button, Input, Card } from '@/components/ui';

function App() {
  return (
    <Card>
      <Input placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

## CLI Commands

### `init`

Initialize Kigumi in your project with theme selection.

```bash
npx kigumi init
```

You'll be prompted to select:
- Framework (React, Vue, Svelte)
- Web Awesome tier (Free or Pro)
- Theme (default, awesome, shoelace, or none)
- Color palette
- Brand color (blue, purple, green, red, orange, yellow, cyan, indigo, pink, gray)

### `add [components...]`

Add components to your project.

```bash
npx kigumi add button input
npx kigumi add --all
npx kigumi add button --overwrite
```

Options:
- `--all`: Add all available components
- `--overwrite`: Overwrite existing components
- `--no-types`: Skip TypeScript type definitions

### `list`

List all available components.

```bash
npx kigumi list
```

### Theme Management

Switch themes, palettes, and brand colors after initialization.

```bash
# List available themes, palettes, and brand colors
npx kigumi theme list

# Show current theme configuration
npx kigumi theme show

# Switch to a different theme
npx kigumi theme set awesome
npx kigumi theme set shoelace
npx kigumi theme set none

# Change brand color
npx kigumi brand purple
npx kigumi brand green

# Change color palette
npx kigumi palette default
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run built CLI
npm start
```

## How It Works

1. **Component Registry**: Maintains a registry of all Web Awesome components with metadata
2. **Templates**: Uses Handlebars templates for each framework (React, Vue, Svelte)
3. **Auto-Generation**: Generates framework-specific wrappers with proper TypeScript types
4. **File Management**: Automatically updates imports, exports, and type declarations

## Roadmap

- [ ] More framework support (Angular, Solid)
- [ ] Remote component registry
- [ ] Component preview/documentation generation
- [ ] Custom template overrides
- [ ] Component composition examples
- [ ] Storybook integration

## License

MIT

## Credits

Inspired by [shadcn/ui](https://ui.shadcn.com) - built for [Web Awesome](https://awesome.me)
