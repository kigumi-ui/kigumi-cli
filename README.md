# Kigumi CLI

> Add Web Awesome components to your React, Vue, or Svelte project

Inspired by [shadcn/ui](https://ui.shadcn.com), Kigumi provides a seamless way to integrate Web Awesome components with framework-specific wrappers.

## ✨ Features

- 🎯 **Framework Support**: React (Vue/Svelte coming soon)
- 📦 **Component Registry**: 40+ Web Awesome components
- 🎨 **Theme System**: 11 themes + 9 color palettes
- 🌈 **Brand Colors**: Customize with your brand
- ⚡ **Hot Reload**: Theme changes apply instantly
- 📝 **TypeScript First**: Auto-generated types
- 🔧 **Free & Pro Tiers**: Flexible licensing

## 🚀 Quick Start

### React + Vite (Recommended)

#### 1. Create Project

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
```

#### 2. Configure Path Aliases

**`tsconfig.json`** or **`tsconfig.app.json`** (TypeScript) / **`jsconfig.json`** (JavaScript):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**`vite.config.ts`** (or `.js`):

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 3. Initialize Kigumi

**Free Tier**:

```bash
npx kigumi init
# Interactive: Follow prompts for Framework → Theme → Palette → Brand

# Or non-interactive:
npx kigumi init --framework=react --theme=awesome --palette=default --brand=purple
```

**Pro Tier**:

```bash
npx kigumi init --framework=react --theme=brutalist --token=YOUR_PRO_TOKEN
```

> **Get Pro Token**: [webawesome.com](https://webawesome.com) → Settings → API Tokens

**What `init` does**:

- ✅ Creates `kigumi.config.json`
- ✅ Generates `src/lib/webawesome.ts` (theme setup)
- ✅ Generates `src/styles/theme.css` (customization)
- ✅ Creates `.env` (Pro only, with token)
- ✅ Creates `.npmrc` (registry configuration)
- ✅ Installs Web Awesome package automatically
- ✅ Generates TypeScript definitions (if TypeScript)

#### 4. Import Web Awesome

**`src/main.tsx`** (or `main.jsx`):

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@/lib/webawesome'; // Add this line

createRoot(document.getElementById('root')!).render(<App />);
```

#### 5. Add Components

```bash
# Add single component
npx kigumi add button

# Add multiple components
npx kigumi add button input card dialog

# Interactive selection
npx kigumi add

# Add all components
npx kigumi add --all
```

#### 6. Use Components

**`src/App.tsx`**:

```tsx
import { Button, Input, Card } from '@/components/ui';

function App() {
  return (
    <Card>
      <Input placeholder="Enter your name" />
      <Button variant="brand">Submit</Button>
    </Card>
  );
}

export default App;
```

#### 7. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 📦 CLI Commands

### `init` - Initialize Kigumi

```bash
npx kigumi init

# Non-interactive
npx kigumi init --framework=react --theme=awesome --token=YOUR_TOKEN
```

Initializes Kigumi in your project and installs dependencies automatically.

### `add [components...]` - Add Components

```bash
npx kigumi add button
npx kigumi add button input card
npx kigumi add --all
npx kigumi add button --overwrite
```

**Options**:

- `--all` - Add all available components
- `--overwrite` - Overwrite existing components

### `list` - List Components

```bash
npx kigumi list
```

Shows all available components with tier requirements.

### `theme` - Theme Management

```bash
# Show current theme
npx kigumi theme show

# List available themes
npx kigumi theme list

# Switch theme
npx kigumi theme set awesome
npx kigumi theme set brutalist

# Change palette
npx kigumi palette default
npx kigumi palette rudimentary

# Change brand color
npx kigumi brand purple
npx kigumi brand green
```

**Available Themes**:

| Theme     | Tier | Style               |
| --------- | ---- | ------------------- |
| awesome   | Both | Web Awesome default |
| light     | Both | Light & clean       |
| dark      | Both | Dark mode           |
| brutalist | Pro  | Bold & raw          |
| material  | Pro  | Material Design     |
| ios       | Pro  | iOS style           |
| fluent    | Pro  | Microsoft Fluent    |
| nord      | Pro  | Nord color scheme   |
| neon      | Pro  | Neon glow           |
| coffee    | Pro  | Warm coffee tones   |
| ocean     | Pro  | Ocean blues         |

**Available Palettes**: default, bright, subdued, high-contrast, low-contrast, warm, cool, rudimentary, vivid (all available for both tiers)

**Brand Colors**: blue, purple, green, red, orange, yellow, cyan, indigo, pink, gray

---

## 🎨 Customization

Override Web Awesome design tokens in `src/styles/theme.css`:

```css
:root {
  /* Spacing */
  --wa-space-xs: 0.25rem;
  --wa-space-s: 0.5rem;
  --wa-space-m: 1rem;

  /* Typography */
  --wa-font-size-s: 0.875rem;
  --wa-font-weight-bold: 700;

  /* Brand color */
  --wa-color-brand-fill-loud: #your-custom-color;
}
```

See [Web Awesome tokens](https://webawesome.com/docs/tokens) for all available tokens.

---

## 🆓 Free vs Pro

| Feature            | Free | Pro |
| ------------------ | ---- | --- |
| **Themes**         | 3    | 11  |
| **Palettes**       | 9    | 9   |
| **Components**     | 30+  | 40+ |
| **Pro Components** | ❌   | ✅  |

**Pro-only components**: page, charts, combobox, data-grid, date-picker, file-input, toast, video

### Upgrading Free → Pro

1. Get Pro token from [webawesome.com](https://webawesome.com)
2. Run `npx kigumi init --token=YOUR_PRO_TOKEN`
3. Done! Existing components are automatically migrated

---

## 🔧 Configuration

`kigumi.config.json`:

```json
{
  "framework": "react",
  "typescript": true,
  "componentsDir": "src/components/ui",
  "utilsDir": "src/lib",
  "theme": {
    "selected": "awesome",
    "palette": "default",
    "brandColor": "purple"
  },
  "aliases": {
    "@/components": "./src/components",
    "@/lib": "./src/lib"
  },
  "webAwesome": {
    "version": "^3.1.0"
  }
}
```

**Tier Detection**: Automatically detected from `.env` file. If `WEBAWESOME_NPM_TOKEN` exists, Pro tier is used.

---

## 🔧 Development

### Code Quality Tools

This project uses automated code quality tools to ensure consistent, high-quality code:

- **ESLint**: Lints TypeScript/JavaScript code for errors and code quality issues
- **Prettier**: Formats code consistently across the entire codebase
- **Husky**: Manages Git hooks to enforce quality standards before commits
- **lint-staged**: Runs linting/formatting only on staged files for efficient pre-commit checks

### Available Scripts

```bash
# Linting
pnpm lint          # Check for linting issues
pnpm lint:fix      # Auto-fix linting issues

# Formatting
pnpm format        # Format all code with Prettier
pnpm format:check  # Check if code is formatted correctly

# Type Checking
pnpm type-check    # Run TypeScript type checker

# Testing
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode

# Building
pnpm build         # Build the CLI for distribution
pnpm dev           # Run the CLI in development mode with watch
```

### Pre-Commit Hooks

All commits are automatically checked before being created:

1. **ESLint** runs on staged TypeScript files (errors block commits)
2. **Prettier** formats all staged files automatically

This ensures all committed code meets quality standards.

---

## 🐛 Troubleshooting

### "Failed to resolve import @/lib/webawesome"

Configure path aliases in `vite.config.ts` and `tsconfig.json` (see Quick Start step 2).

### "401 Unauthorized" when installing Pro

Invalid token in `.env`. Get new token from [webawesome.com](https://webawesome.com).

### Components render unstyled

1. Check `src/lib/webawesome.ts` has component imports
2. Verify `import '@/lib/webawesome'` in `src/main.tsx`

### Components don't render at all

Add `import '@/lib/webawesome'` to your main entry file (see Quick Start step 4).

### TypeScript errors with React hooks

Web component wrappers use `import React from 'react'` (not named imports) for compatibility.

### Registry mismatch errors (pnpm)

Run `rm -rf node_modules pnpm-lock.yaml && pnpm install` to recreate lockfile with new registry configuration.

---

## 📚 Documentation

- **AGENTS.md** - AI assistant development guide
- **CLAUDE.md** - Human developer documentation

---

## 🗺️ Roadmap

- [ ] Vue framework support
- [ ] Svelte framework support
- [ ] Angular framework support
- [ ] Remote component registry
- [ ] Component preview/documentation generation
- [ ] Storybook integration

---

## 📄 License

MIT

---

## 💙 Credits

Inspired by [shadcn/ui](https://ui.shadcn.com) - Built for [Web Awesome](https://awesome.me)
