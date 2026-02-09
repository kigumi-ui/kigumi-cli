![Kigumi logo](https://kigumi.style/og-image.png)

# Kigumi

> Build framework-agnostic UIs with ready-made web components. Same components, any stack.

ℹ️ Available for React and Vue. Angular and Svelte are coming soon.

## Quick Start

```bash
npx kigumi init
npx kigumi add button input
```

Import in your entry file (e.g. `src/main.tsx`):

```tsx
import '@/lib/webawesome';
```

Use components:

```tsx
import { Button, Input } from '@/components/ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log('Email:', email);
      }}
    >
      <Input
        type="email"
        label="Email"
        value={email}
        onInput={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="brand">
        Sign In
      </Button>
    </form>
  );
}
```

## Commands

### `init`

Initialize Kigumi in your project. Sets up theming and installs dependencies.

```bash
npx kigumi init
```

**Own Web Awesome Pro license?**

To unlock premium themes and Pro-only components, you need a Web Awesome Pro account. [Get your token](https://webawesome.com/login) and choose one of the following token setup methods:

```bash

# Option 1: During `init` command (recommended)
npx kigumi init --token YOUR_TOKEN

# Option 2: Global
npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN

# Option 3: In .env file
WEBAWESOME_NPM_TOKEN=your_token

# Option 4: In .npmrc file
//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN
```

### `add`

Add components to your project:

```bash
npx kigumi add <components> # Add specific components (e.g., button input card)
npx kigumi add              # Interactive component selector
npx kigumi add --all        # Add all 80+ components at once
```

### `theme`

Change [theme](https://webawesome.com/docs/themes), [palette](https://webawesome.com/docs/color-palettes), or brand color:

```bash
npx kigumi theme [name]    # Change theme (shows selector if name omitted)
npx kigumi palette [name]  # Change color palette
npx kigumi brand [color]   # Change brand color
```

### `doctor`

Diagnose and fix common issues in your project:

```bash
npx kigumi doctor           # Scan and fix import path issues
npx kigumi doctor --dry-run # Report issues without fixing
```

The doctor command automatically detects your tier (Free/Pro) and ensures all component imports use the correct package. Useful when upgrading from Free to Pro or encountering import errors.

## Agent Skills

Kigumi provides AI agent skills for transforming Web Awesome HTML to Kigumi components and for working with design tokens.

```bash
npx skills add https://kigumi.style/skills
```

## Utility Classes

With the included [style](https://webawesome.com/docs/utilities) and [layout](https://webawesome.com/docs/layout/) utility classes you can quickly build your UI:

```tsx
<div className="wa-stack wa-gap-m">
  <h1 className="wa-heading-2xl">Welcome</h1>
  <p className="wa-text-muted">Get started below</p>
</div>
```

## Customization

Add your custom CSS overrides in `src/styles/theme.css`:

```css
:root {
  --wa-color-brand-600: #6366f1;
  --wa-font-family-sans: 'Inter', system-ui, sans-serif;
  --wa-border-radius-medium: 0.5rem;
}
```

**Note:** Theme selection is handled via `kigumi theme` command, which updates `src/lib/webawesome.ts`. The `theme.css` file is for your custom CSS only.

[Design Tokens Reference](https://webawesome.com/docs/tokens)
[Theming Guide](https://webawesome.com/docs/themes)

## CSS Architecture

Kigumi uses CSS cascade layers (`@layer`) for predictable style precedence:

**Layer hierarchy:**

1. **base** - Web Awesome foundation + theme styles (lowest priority)
2. **theme** - Your custom CSS overrides in `src/styles/theme.css` (higher priority)

Later layers always override earlier layers, regardless of specificity. This means your custom styles in `theme.css` will reliably override Web Awesome defaults without needing `!important`.

## Troubleshooting

### Import errors with @ alias

If you see errors like `Cannot find module '@/lib/webawesome'`, configure path aliases:

**Vite (vite.config.ts):**

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**TypeScript (tsconfig.json):**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Pro token authentication fails

If `npm install` fails with 401 errors:

1. Configure your token globally:

   ```bash
   npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN
   ```

2. Verify it's configured:

   ```bash
   npm config get //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken
   ```

3. Check your token is valid at [https://webawesome.com/login](https://https://webawesome.com/login)

### Component styles not loading

Make sure you've imported the Web Awesome setup in your app entry point:

```tsx
import '@/lib/webawesome'; // Must be imported before components
```

## Resources

- [Web Awesome Documentation](https://webawesome.com/docs)
- [Component Gallery](https://webawesome.com/docs/components)

## License

MIT
