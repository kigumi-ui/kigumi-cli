All required components are already installed in your project (Input, Textarea, Switch). No installation needed.

```tsx
import { Input, Switch, Textarea } from '@/components/ui';

export default function ProfileForm() {
  return (
    <form style={{ maxWidth: '60ch', margin: 'auto' }}>
      <div
        className="wa-grid"
        style={{ '--min-column-size': '200px' } as React.CSSProperties}
      >
        <Input label="First name" required />
        <Input label="Last name" required />
      </div>
      <Textarea label="Bio" rows={4} style={{ marginTop: '1rem' }} />
      <Switch checked>Enable notifications</Switch>
    </form>
  );
}
```

### Transformations applied

1. **Component mapping**: `wa-input` -> `<Input>`, `wa-textarea` -> `<Textarea>`, `wa-switch` -> `<Switch>` (all PascalCase, self-closing where no children).
2. **`class` -> `className`**: The `wa-grid` utility class on the `<div>` uses `className` since this is React JSX.
3. **Inline styles converted to React object syntax**:
   - `style="max-width: 60ch; margin: auto"` -> `style={{ maxWidth: '60ch', margin: 'auto' }}` (camelCase keys, string values).
   - `style="--min-column-size: 200px"` -> `style={{ '--min-column-size': '200px' } as React.CSSProperties}` (CSS custom properties require the `React.CSSProperties` type assertion in TypeScript).
   - `style="margin-top: 1rem"` -> `style={{ marginTop: '1rem' }}`.
4. **Boolean attribute**: `checked` on `<Switch>` kept as a bare prop (JSX boolean shorthand).
5. **Numeric attribute**: `rows="4"` on `<Textarea>` converted to `rows={4}` (JSX number expression).
6. **Self-closing tags**: `<Input />` and `<Textarea />` use JSX self-closing syntax since they have no children.
7. **Imports**: Single import from `@/components/ui` using the configured alias from `kigumi.config.json`.
