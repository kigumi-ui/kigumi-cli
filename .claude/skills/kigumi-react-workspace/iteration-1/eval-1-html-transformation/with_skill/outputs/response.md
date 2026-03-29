All four required components (Card, Icon, Input, Button) are already installed in your project -- no installation needed.

```tsx
import { Button, Card, Icon, Input } from '@/components/ui';

export default function SettingsCard() {
  return (
    <Card>
      <div slot="header">
        <Icon name="gear" />
        Settings
      </div>
      <Input label="Username" value="mischa" className="wa-mb-m" />
      <Button variant="brand" loading>
        Save Changes
      </Button>
    </Card>
  );
}
```

**Transformations applied:**

- `<wa-card>` to `<Card>`, `<wa-icon>` to `<Icon>`, `<wa-input>` to `<Input>`, `<wa-button>` to `<Button>`
- `<wa-icon name="gear"></wa-icon>` converted to self-closing `<Icon name="gear" />`
- `class="wa-mb-m"` on `<Input>` changed to `className="wa-mb-m"` (React wrapper accepts `className` via `HTMLAttributes`)
- `variant="primary"` mapped to `variant="brand"` (Kigumi uses "brand" instead of "primary")
- `loading` boolean attribute preserved as a JSX prop
- `slot="header"` on the `<div>` preserved as-is
