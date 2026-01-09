# Installation

Get started with Kigumi CLI in your project.

## Vite

### Create project

Start by creating a new Vite project with your framework of choice:

```bash
npm create vite@latest my-app
cd my-app
npm install
```

### Configure path aliases

Edit `tsconfig.json` or `tsconfig.app.json` to add path mapping:

```json {4-5}
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Edit `vite.config.ts` to add path resolution:

```ts {3,7-11}
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

### Run the CLI

Initialize Kigumi in your project:

```bash
npx kigumi init
```

Or use CLI flags for non-interactive setup (recommended for CI/CD):

```bash
npx kigumi init \
  --framework=react \
  --tier=pro \
  --theme=brutalist \
  --palette=rudimentary \
  --brand=purple \
  --token=v7YAcspt5xaaAe_9l_tr8
```

> **Note**: If you provide `--token`, the CLI automatically saves it to `.env` for you.

### Install dependencies

**For Free tier:** The CLI automatically installs `@awesome.me/webawesome`.

**For Pro tier:** Run the install command (it handles token authentication for you):

```bash
npx kigumi install
```

The `kigumi install` command:
- Reads your token from `.env`
- Installs `@awesome.me/webawesome-pro` with authentication
- Also installs `clsx` for React projects

Get your token from [webawesome.com](https://webawesome.com) → Settings → API Tokens.

### Import Web Awesome

Add the Web Awesome import to your main entry file (`src/main.tsx` for React):

```ts {3}
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@/lib/webawesome';

createRoot(document.getElementById('root')!).render(<App />);
```

### Add components

Start adding components to your project:

```bash
npx kigumi add button
npx kigumi add input card dialog
```

### Start developing

Run your dev server:

```bash
npm run dev
```

---

## Astro

### Create project

Start by creating a new Astro project:

```bash
npm create astro@latest my-app
cd my-app
npm install
```

### Configure path aliases

Edit `tsconfig.json` to add path mapping:

```json {4-7}
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Edit `astro.config.mjs` to add path resolution:

```js {1,5-9}
import path from 'path';
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});
```

### Run the CLI

Initialize Kigumi in your project:

```bash
npx kigumi init --framework=astro
```

Or with CLI flags:

```bash
npx kigumi init \
  --framework=astro \
  --tier=pro \
  --theme=brutalist \
  --palette=rudimentary \
  --brand=purple \
  --token=your-token-here
```

### Install dependencies

**For Free tier:** The CLI automatically installs `@awesome.me/webawesome`.

**For Pro tier:** Run the install command (it handles token authentication for you):

```bash
npx kigumi install
```

The `kigumi install` command:
- Reads your token from `.env`
- Installs `@awesome.me/webawesome-pro` with authentication
- Also installs `clsx` for React projects

Get your token from [webawesome.com](https://webawesome.com) → Settings → API Tokens.

### Import Web Awesome

Create or edit your layout file (e.g., `src/layouts/Layout.astro`) and import Web Awesome:

```astro {2}
---
import '@/lib/webawesome';
---

<!doctype html>
<html lang="en">
  <head>
    <!-- your head content -->
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Add components

Start adding components:

```bash
npx kigumi add button
npx kigumi add input card dialog
```

### Start developing

Run your dev server:

```bash
npm run dev
```

---

## What Kigumi Does

When you run `kigumi init`, the CLI:

1. ✅ Creates `kigumi-components.json` configuration
2. ✅ Creates `.env` and `.env.example` for Pro tokens
3. ✅ Creates `.npmrc` for Pro registry (if using Pro tier)
4. ✅ Generates `src/lib/webawesome.ts` with theme setup
5. ✅ Generates `src/vite-env.d.ts` with TypeScript definitions (React)
6. ✅ Creates `src/styles/theme.css` for custom theme overrides
7. ✅ Installs `@awesome.me/webawesome` package (Free tier only)

## What You Must Do Manually

1. ❌ Run `kigumi install` (Pro tier only)
2. ❌ Configure path aliases (`vite.config.ts` / `astro.config.mjs` + `tsconfig.json`)
3. ❌ Add the Web Awesome import to your main entry file

This is intentional - different projects have different configurations, and we don't want to break your existing setup.

---

## CLI Flags

The `kigumi init` command supports the following flags:

```bash
--framework <framework>   # react | vue | svelte | astro
--typescript              # Use TypeScript
--no-typescript           # Use JavaScript
--tier <tier>             # free | pro
--theme <theme>           # Theme name
--palette <palette>       # Color palette
--brand <color>           # Brand color
--token <token>           # Pro tier authentication token
--components-dir <dir>    # Components directory (default: src/components/ui)
--utils-dir <dir>         # Utils directory (default: src/lib)
```

Example non-interactive setup:

```bash
npx kigumi init \
  --framework=react \
  --typescript \
  --tier=pro \
  --theme=brutalist \
  --palette=rudimentary \
  --brand=purple \
  --token=v7YAcspt5xaaAe_9l_tr8 \
  --components-dir=src/components/ui \
  --utils-dir=src/lib
```

---

## Troubleshooting

### "Failed to resolve import @/lib/webawesome"

You haven't configured path aliases. See the [Configure path aliases](#configure-path-aliases) section for your framework.

### "401 Unauthorized" when installing Pro package

Your `WEBAWESOME_NPM_TOKEN` in `.env` is invalid or expired. Get a new token from [webawesome.com](https://webawesome.com).

### Components not rendering

Make sure you've imported Web Awesome in your main entry file. See the [Import Web Awesome](#import-web-awesome) section.

---

## Next Steps

- Browse available components: `npx kigumi list`
- Add components: `npx kigumi add [component]`
- Change theme: `npx kigumi theme set [theme]`
- Customize colors: Edit `src/styles/theme.css`
