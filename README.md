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
35+ components with TypeScript support, accessibility built-in, and 11 themes included.

## Commands

### `init`

Initialize Kigumi in your project. Sets up theming and installs dependencies.

```bash
npx kigumi init
```

**Web Awesome Pro:** To use Pro themes and components, provide your token during init:

```bash
npx kigumi init --token=YOUR_PRO_TOKEN
```

This saves your token to `.env` and configures `.npmrc` automatically. When you run `npm install`, your package manager reads the token from `.env` and authenticates with the Pro registry.

**Manual setup:** If you prefer to configure manually, add your token to `.env`:

```bash
echo "WEBAWESOME_NPM_TOKEN=your_token_here" >> .env
```

Then run `npx kigumi init` (without the `--token` flag) to complete setup.

### `add`

Add components to your project:

```bash
npx kigumi add <components> # Add specific components
npx kigumi add              # Add from list of components
npx kigumi add --all        # Add all components
```

### `theme`

Change theme, palette, or brand color:

```bash
kigumi theme <name>   # Change theme
kigumi palette <name> # Change color palette
kigumi brand <color>  # Change brand color
```

**Free themes:** `default`, `awesome`, `shoelace`
**Pro themes:** `brutalist`, `glossy`, `matter`, `mellow`, `playful`, `premium`, `tailspin`, `active`
**Brand colors:** `blue`, `indigo`, `purple`, `pink`, `red`, `orange`, `yellow`, `green`, `cyan`, `gray`

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

## Resources

- [Web Awesome Documentation](https://webawesome.com/docs)
- [Component Gallery](https://webawesome.com/docs/components)
- [GitHub Repository](https://github.com/giregar/kigumi-cli)
- [Report Issues](https://github.com/giregar/kigumi-cli/issues)

## License

MIT
