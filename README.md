# Kigumi

> Build framework-agnostic UIs with ready-made components. Kigumi wraps Web Components for React (Vue, Angular, Svelte soon). Same components, any stack.

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

## Why Kigumi

**Framework-agnostic by design**
Build your UI once. Web Components work in React, Vue, Angular, Svelte, or vanilla JS.

**You own the code**
Components are copied to your project. Modify, extend, or remove whatever you need.

**Production-ready**
50+ components (including Pro-only advanced components) with TypeScript support, accessibility built-in, and 11 themes included.

## Commands

### `init`

Initialize Kigumi in your project. Sets up theming and installs dependencies.

```bash
npx kigumi init
```

**Web Awesome Pro:** Provide your token during `init` to unlock premium themes and Pro-only components:

```bash
npx kigumi init --token=YOUR_PRO_TOKEN
```

This saves your token to `.env` and configures authentication automatically. To change your token later, edit `.env` or run `init` again with a new token.

### `add`

Add components to your project:

```bash
npx kigumi add <components> # Add specific components (e.g., button input card)
npx kigumi add              # Interactive component selector
npx kigumi add --all        # Add all 80+ components at once
```

### `list`

View all available components:

```bash
npx kigumi list
```

Shows component name, description, and Pro badge for Pro-only components.

### `theme`

Change theme, palette, or brand color:

```bash
npx kigumi theme [name]    # Change theme (shows selector if name omitted)
npx kigumi palette [name]  # Change color palette
npx kigumi brand [color]   # Change brand color
```

**Free themes:** `default`, `awesome`, `shoelace`
**Pro themes:** `brutalist`, `glossy`, `matter`, `mellow`, `playful`, `premium`, `tailspin`, `active`
**Color palettes:** `default`, `bright`, `shoelace`, `rudimentary`, `elegant`, `mild`, `natural`, `anodized`, `vogue`
**Brand colors:** `blue`, `purple`, `green`, `red`, `orange`, `yellow`, `cyan`, `indigo`, `pink`, `gray`

## Utility Classes

With the included [style](https://webawesome.com/docs/utilities) and [layout](https://webawesome.com/docs/layout/) utility classes you can quickly build your UI:

```tsx
<div className="wa-stack wa-gap-md">
  <h1 className="wa-heading-2xl">Welcome</h1>
  <p className="wa-text-muted">Get started below</p>
</div>
```

## Customization

Override design tokens in `src/styles/theme.css`:

```css
:root {
  --wa-color-brand-600: #6366f1;
  --wa-font-family-sans: 'Inter', system-ui, sans-serif;
  --wa-border-radius-medium: 0.5rem;
}
```

[Design Tokens Reference](https://webawesome.com/docs/tokens)
[Theming Guide](https://webawesome.com/docs/themes)

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

1. Verify your token is in `.env`: `cat .env | grep WEBAWESOME_NPM_TOKEN`
2. Check your token is valid at [webawesome.com/account](https://webawesome.com/account)
3. Ensure `.npmrc` exists and references the token correctly

### Component styles not loading

Make sure you've imported the Web Awesome setup in your app entry point:

```tsx
import '@/lib/webawesome'; // Must be imported before components
```

### Need more help?

- [Web Awesome Documentation](https://webawesome.com/docs)
- [GitHub Issues](https://github.com/giregar/kigumi-cli/issues)
- Run `npx kigumi --help` for command reference

## Resources

- [Web Awesome Documentation](https://webawesome.com/docs)
- [Component Gallery](https://webawesome.com/docs/components)
- [GitHub Repository](https://github.com/giregar/kigumi-cli)
- [Report Issues](https://github.com/giregar/kigumi-cli/issues)

## License

MIT
