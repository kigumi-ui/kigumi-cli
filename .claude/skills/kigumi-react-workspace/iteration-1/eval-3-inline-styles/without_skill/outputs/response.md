# Kigumi React Conversion: Inline Styles Form

## Install Required Components

```bash
npx kigumi add input textarea switch
```

## Component Code

```tsx
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export function ProfileForm() {
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

## Key Conversion Notes

1. **Component imports**: Each `wa-*` element is replaced with its Kigumi React wrapper imported from `@/components/ui`. Install them first with `npx kigumi add input textarea switch`.

2. **Inline styles on native HTML elements** (`<form>`, `<div>`): Converted from HTML string syntax to React's `style` object syntax with camelCase properties (`max-width` becomes `maxWidth`).

3. **CSS custom properties in style objects**: The `--min-column-size` custom property on the `wa-grid` div requires a `as React.CSSProperties` type assertion because TypeScript does not recognize CSS custom properties as valid style keys by default.

4. **`class` vs `className`**: The `wa-grid` utility class is on a plain `<div>`, not a `wa-*` web component, so it uses React's `className` attribute. If it were on a `wa-*` element, you would use `class` instead (web components do not use React's `className`).

5. **Inline styles on Kigumi components**: The `style` prop on `<Textarea>` is passed through to the underlying `wa-textarea` web component. Kigumi wrappers forward standard HTML attributes.

6. **Boolean attributes**: `required` and `checked` are passed as bare props (equivalent to `true` in JSX). The `rows` attribute is passed as a number (`rows={4}`), not a string.
