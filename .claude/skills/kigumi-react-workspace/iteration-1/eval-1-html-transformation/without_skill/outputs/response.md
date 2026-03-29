# HTML to Kigumi React Conversion

## Install Required Components

```bash
npx kigumi add card icon input button
```

## React Component

```tsx
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SettingsCard() {
  return (
    <Card>
      <div slot="header">
        <Icon name="gear" />
        Settings
      </div>
      <Input label="Username" value="mischa" class="wa-mb-m" />
      <Button variant="primary" loading>
        Save Changes
      </Button>
    </Card>
  );
}
```

## Key Conversion Notes

1. **Imports**: Each `wa-*` element maps to a PascalCase Kigumi wrapper imported from `@/components/ui/<name>`.
2. **Tag mapping**: `wa-card` becomes `<Card>`, `wa-icon` becomes `<Icon>`, `wa-input` becomes `<Input>`, `wa-button` becomes `<Button>`.
3. **Attributes carry over**: Props like `label`, `value`, `variant`, `name`, and `loading` pass through directly to the underlying web component.
4. **`slot` attribute**: The `slot="header"` attribute stays on the wrapper `<div>`, not on the Kigumi component itself. Web component slots work via the `slot` attribute on child elements.
5. **`class` not `className`**: On `wa-*` web components (and their Kigumi wrappers), use `class` instead of React's `className`. The utility class `wa-mb-m` provides medium bottom margin.
6. **Boolean attributes**: `loading` is a boolean prop; its presence sets it to `true`.
