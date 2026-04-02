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
import '@/lib/kigumi';
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

To unlock premium themes and Pro-only components, you need a Web Awesome Pro account. [Get your token](https://webawesome.com/login) and configure it:

```bash
# Option 1: During `init` command (recommended)
npx kigumi init --token YOUR_TOKEN

# Option 2: Set it globally (once per machine)
npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN

# Option 3: In project .env file
echo "WEBAWESOME_NPM_TOKEN=your_token" > .env

# Option 4: Environment variable (CI/CD)
export WEBAWESOME_NPM_TOKEN=your_token
```

### `add`

Add components to your project:

```bash
npx kigumi add <components>              # Add specific components (e.g., button input card)
npx kigumi add                           # Interactive component selector
npx kigumi add --all                     # Add all available components at once
npx kigumi add --from <url>              # Install from a community registry
npx kigumi add <comp> --from <url>       # Install specific component from community registry
```

### `theme`

Change [theme](https://webawesome.com/docs/themes), [palette](https://webawesome.com/docs/color-palettes), or brand color:

```bash
npx kigumi theme [name]                      # Change theme (shows selector if name omitted)
npx kigumi theme list                         # List available themes for your tier
npx kigumi theme show                         # Show current theme, palette, brand color
npx kigumi theme install <name> --from <url>  # Install a community theme
npx kigumi palette [name]                     # Change color palette
npx kigumi brand [color]                      # Change brand color
```

### `doctor`

Diagnose and fix common issues in your project:

```bash
npx kigumi doctor           # Scan and fix issues automatically
npx kigumi doctor --dry-run # Report issues without fixing
```

The doctor command checks for:

- **Import path mismatches** — Detects and fixes components importing the wrong package (e.g., free instead of pro)
- **Config version staleness** — Updates `kigumi.config.json` when its Web Awesome version falls behind the CLI target (auto-fixable)
- **Package version staleness** — Warns when your installed Web Awesome package differs from the CLI target and provides upgrade instructions

Useful after upgrading Kigumi CLI, switching tiers (Free↔Pro), or encountering import errors.

### `list`

List all available components:

```bash
npx kigumi list              # Interactive list
npx kigumi list --json       # Machine-readable JSON output
```

### `status`

Show your project's current configuration at a glance:

```bash
npx kigumi status            # Interactive display
npx kigumi status --json     # Machine-readable JSON output
```

### `upgrade`

When a new version of Kigumi CLI is released, upgrade your project in one step:

```bash
npx kigumi upgrade               # Upgrade version + install updated dependencies
npx kigumi upgrade --dry-run     # Preview changes without modifying anything
npx kigumi upgrade --no-install  # Update config only, skip dependency installation
```

The upgrade command:

- **Compares versions** — your pinned version vs. the CLI version
- **Shows breaking changes** — what changed and how to migrate
- **Updates config** — pins the new version and Web Awesome version
- **Installs dependencies** — automatically updates the Web Awesome package when the version changed

### `diff`

Compare your installed components against the current templates to see what's changed:

```bash
npx kigumi diff                # Diff all installed components
npx kigumi diff button card    # Diff specific components
```

Useful before running `--overwrite` to understand which files have local modifications.

For files with differences, a colored line-by-line diff is displayed automatically.

### `update` — Smart Component Updates

Three-way merge: applies template updates while preserving your local edits.

```bash
npx kigumi update              # Update all installed components
npx kigumi update button dialog # Update specific components
npx kigumi update --dry-run     # Preview changes without writing
npx kigumi update --force       # Overwrite without merge
```

When you update Kigumi CLI and templates change, `update` compares three versions:

- **Base**: The original template output (stored in `.kigumi/snapshots/`)
- **Yours**: Your current file with local customizations
- **Theirs**: The freshly generated template from the new CLI version

If both you and the template changed the same lines, conflict markers are inserted for manual resolution.

### Version Pinning

Kigumi tracks which CLI version generated your project in `kigumi.config.json`. This ensures you stay on a compatible version and don't accidentally upgrade Web Awesome.

```bash
# Pin your project to the current CLI version
npx kigumi upgrade

# Use a specific CLI version (matches your project)
npx kigumi@0.12.0 add button

# Check your pinned version
npx kigumi status
```

When the CLI version doesn't match your project:

- **Minor mismatch** (e.g., 0.11 → 0.12): warning, continues normally
- **Major mismatch** (e.g., 0.x → 1.x): hard error with instructions to upgrade or use the matching version

### `registry`

Manage community component and theme registries:

```bash
npx kigumi registry init              # Scaffold a new community registry
npx kigumi registry validate          # Validate your registry.json
npx kigumi registry connect <url>     # Connect a community registry to your project
npx kigumi registry list              # List connected registries
npx kigumi registry remove <url>      # Remove a registry
npx kigumi registry add-component     # Add a component entry to registry.json
npx kigumi registry add-theme         # Add a theme entry to registry.json
```

## Community Registries

Share custom components and themes with others via GitHub-based registries. A community registry is a GitHub repo containing a `registry.json` file that describes available components and themes.

### Install from a Registry

```bash
# Connect a registry (one-time)
npx kigumi registry connect https://github.com/user/my-registry

# Then install using the registry name
npx kigumi add button --from my-registry
npx kigumi theme install my-theme --from my-registry

# Full URLs also work directly
npx kigumi add button --from https://github.com/user/my-registry
```

Private GitHub repos are supported via `GITHUB_TOKEN` or `gh auth`.

Community components get snapshots on install, enabling `kigumi update` to apply future changes via three-way merge.

### Create Your Own Registry

```bash
# 1. Scaffold the registry
npx kigumi registry init
```

This creates the following structure:

```
my-registry/
├── registry.json          # Registry metadata (components + themes)
├── components/
│   └── react/             # One directory per framework
└── themes/
```

### Add a Theme

Place your theme CSS in `themes/` and register it:

```bash
# Create the theme file
mkdir -p themes/my-theme
# Add your CSS with Web Awesome custom properties (:root, .wa-dark)

# Register it in registry.json
npx kigumi registry add-theme
# Prompts for: slug, name, description, CSS file path
```

A theme CSS file uses Web Awesome design tokens as CSS custom properties:

```css
:root {
  --wa-color-brand: #6200ee;
  --wa-font-family-heading: 'Space Grotesk', sans-serif;
  --wa-border-radius-scale: 0;
}
.wa-dark {
  --wa-color-brand: #bb86fc;
  --wa-color-surface-default: #1e1e1e;
}
```

### Add Components

Place your component files in `components/{framework}/` and register them:

```bash
# Create the component
mkdir -p components/react/MyButton
# Add MyButton.tsx and MyButton.css

# Register it in registry.json
npx kigumi registry add-component
# Prompts for: slug, name, description, category, file paths, dependencies
```

Components are pre-rendered files (`.tsx`, `.vue`, etc.) that get copied as-is into the consumer's project. They can use theme CSS variables — consumers install both the theme and components.

### Validate and Publish

```bash
npx kigumi registry validate  # 6-check validation (schema, files, deps, extensions)
git push                       # Push to GitHub — done!
```

### registry.json Reference

```json
{
  "name": "my-registry",
  "version": "1.0.0",
  "frameworks": ["react"],
  "components": {
    "button": {
      "name": "Button",
      "description": "Custom button",
      "category": "Actions",
      "dependencies": [],
      "files": {
        "react": {
          "component": "components/react/Button/Button.tsx",
          "css": "components/react/Button/Button.css",
          "test": "components/react/Button/Button.test.tsx",
          "extras": []
        }
      }
    }
  },
  "themes": {
    "my-theme": {
      "name": "My Theme",
      "description": "A custom theme",
      "files": {
        "css": "themes/my-theme/theme.css",
        "variables": "themes/my-theme/variables.css"
      },
      "extends": "default"
    }
  }
}
```

| Field                                  | Required | Description                                |
| -------------------------------------- | -------- | ------------------------------------------ |
| `name`                                 | Yes      | Registry name                              |
| `version`                              | Yes      | Semver version (e.g. `1.0.0`)              |
| `frameworks`                           | Yes      | Array: `react`, `vue`, `svelte`, `angular` |
| `components[slug].files[fw].component` | Yes      | Main component file path                   |
| `components[slug].files[fw].css`       | No       | CSS file path                              |
| `components[slug].files[fw].test`      | No       | Test file path                             |
| `components[slug].files[fw].extras`    | No       | Additional files (hooks, utils)            |
| `components[slug].dependencies`        | No       | Other component slugs in this registry     |
| `themes[slug].files.css`               | Yes      | Main theme CSS file                        |
| `themes[slug].files.variables`         | No       | CSS variables file                         |
| `themes[slug].extends`                 | No       | Built-in theme to extend                   |

## Global Options

All commands support these flags:

```bash
npx kigumi <command> --verbose   # Show debug output and command timing
npx kigumi <command> --json      # Machine-readable JSON output (list, status)
```

## Agent Skills

Kigumi provides AI agent skills for transforming Web Awesome HTML to Kigumi components and for working with design tokens.

```bash
npx skills add https://kigumi.style
```

## Utility Classes

With the included [style](https://webawesome.com/docs/utilities) and [layout](https://webawesome.com/docs/layout/) utility classes you can quickly build your UI:

```tsx
<div className="wa-stack wa-gap-m">
  <h1 className="wa-heading-2xl">Welcome</h1>
  <p className="wa-color-text-quiet">Get started below</p>
</div>
```

## Customization

Add your custom CSS overrides in `src/styles/theme.css`:

```css
:root {
  --wa-color-brand-60: #6366f1;
  --wa-font-family-body: 'Inter', system-ui, sans-serif;
  --wa-border-radius-m: 0.5rem;
}
```

**Note:** Theme selection is handled via `kigumi theme` command, which updates `src/lib/kigumi.ts`. The `theme.css` file is for your custom CSS only.

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

If you see errors like `Cannot find module '@/lib/kigumi'`, configure path aliases:

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

3. Check your token is valid at [https://webawesome.com/login](https://webawesome.com/login)

**Using pnpm?** pnpm does not use global auth for scoped registries. If 401 persists, add the token to your project `.npmrc` or use `npx kigumi init --token YOUR_TOKEN`.

### Component styles not loading

Make sure you've imported the Web Awesome setup in your app entry point:

```tsx
import '@/lib/kigumi'; // Must be imported before components
```

## Resources

- [Web Awesome Documentation](https://webawesome.com/docs)
- [Component Gallery](https://webawesome.com/docs/components)

## License

MIT
