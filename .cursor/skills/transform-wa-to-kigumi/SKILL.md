# Transform Web Awesome to Kigumi UI

> Converts Web Awesome code snippets to valid Kigumi UI React components with correct imports, components, and classes.

## Trigger Conditions

Use this skill when the user provides Web Awesome HTML code and wants to convert it to Kigumi UI:

- "Transform this Web Awesome code to Kigumi"
- "Convert this wa- code to Kigumi UI"
- "Make this Web Awesome snippet work with Kigumi"
- User pastes HTML with `<wa-*>` tags and asks for Kigumi conversion

## Prerequisites

Before transformation, read the `kigumi.config.json` to determine:

1. **Framework**: `react`, `vue`, or `svelte` (default: `react`)
2. **TypeScript**: `true` or `false` (default: `true`)
3. **Components Directory**: Where UI components are located (e.g., `src/components/ui`)
4. **Aliases**: Import path aliases (e.g., `@/components`, `@/lib`)

## Transformation Rules

### 1. Component Mapping

Map Web Awesome HTML tags to Kigumi React components:

| Web Awesome     | Kigumi Component  | Import Pattern                               |
| --------------- | ----------------- | -------------------------------------------- |
| `<wa-button>`   | `<Button>`        | `import { Button } from '@/components/ui'`   |
| `<wa-card>`     | `<Card>`          | `import { Card } from '@/components/ui'`     |
| `<wa-icon>`     | `<Icon>`          | `import { Icon } from '@/components/ui'`     |
| `<wa-textarea>` | `<Textarea>`      | `import { Textarea } from '@/components/ui'` |
| `<wa-*>`        | `<ComponentName>` | Convert kebab-case to PascalCase             |

**Conversion Pattern:**

```
wa-button-group → ButtonGroup
wa-radio-group → RadioGroup
wa-copy-button → CopyButton
```

### 2. Attribute Mapping

Transform HTML attributes to React props:

| Web Awesome Attribute | React Prop            | Notes                            |
| --------------------- | --------------------- | -------------------------------- |
| `class="..."`         | `className="..."`     | Standard React conversion        |
| `appearance="filled"` | `appearance="filled"` | Keep kebab-case props as-is      |
| `size="small"`        | `size="small"`        | Keep as-is                       |
| `variant="brand"`     | `variant="brand"`     | Keep as-is                       |
| `data-*`              | `data-*`              | Keep data attributes             |
| `aria-*`              | `aria-*`              | Keep ARIA attributes             |
| Kebab-case props      | Keep kebab-case       | e.g., `copy-label`, `with-caret` |

### 3. Slot Mapping

Transform Web Awesome slots to React children with `slot` prop:

**Web Awesome:**

```html
<wa-card>
  <div slot="header">Header</div>
  Content
  <div slot="footer">Footer</div>
</wa-card>
```

**Kigumi React:**

```tsx
<Card>
  <div slot="header">Header</div>
  Content
  <div slot="footer">Footer</div>
</Card>
```

**Note:** Slots are preserved as-is in React with the `slot` attribute.

### 4. Icon Slots

Transform icon slots to proper React syntax:

**Web Awesome:**

```html
<wa-button>
  <wa-icon slot="start" name="paperclip" variant="solid"></wa-icon>
  Button Text
</wa-button>
```

**Kigumi React:**

```tsx
<Button>
  <Icon slot="start" name="paperclip" variant="solid" />
  Button Text
</Button>
```

### 5. CSS Classes

Transform utility classes:

**Web Awesome Classes:**

```html
class="wa-heading-m wa-cluster wa-justify-content-end"
```

**Kigumi Classes:**

```tsx
className = 'wa-heading-m wa-cluster wa-justify-content-end';
```

**Note:** Web Awesome utility classes (prefixed with `wa-`) are preserved as-is. These are part of the Web Awesome design system and work with Kigumi UI.

### 6. Event Handlers

If event handling is needed, add appropriate props:

| Web Awesome Event | React Prop | Type                          |
| ----------------- | ---------- | ----------------------------- |
| `wa-change`       | `onChange` | `(event: Event) => void`      |
| `wa-input`        | `onInput`  | `(event: Event) => void`      |
| `wa-click`        | `onClick`  | Standard React event          |
| `wa-focus`        | `onFocus`  | `(event: FocusEvent) => void` |
| `wa-blur`         | `onBlur`   | `(event: FocusEvent) => void` |

### 7. Import Generation

Generate imports based on `kigumi.config.json`:

**With TypeScript (default):**

```tsx
import { Button, Card, Icon, Textarea } from '@/components/ui';
```

**Without TypeScript:**

```jsx
import { Button, Card, Icon, Textarea } from '@/components/ui';
```

**Custom alias from config:**

```tsx
// If config has: "aliases": { "@/components": "./src/components" }
import { Button } from '@/components/ui';
```

## Workflow Steps

1. **Read Configuration**

   ```bash
   # Read kigumi.config.json to get:
   # - framework (react/vue/svelte)
   # - typescript (true/false)
   # - componentsDir (default: src/components/ui)
   # - aliases (default: @/components)
   ```

2. **Parse Web Awesome HTML**
   - Extract all `<wa-*>` tags
   - Identify attributes and their values
   - Identify slot usage
   - Identify CSS classes

3. **Map Components**
   - Convert `wa-button` → `Button`
   - Convert `wa-card` → `Card`
   - Build list of unique components needed

4. **Transform Attributes**
   - Convert `class` → `className`
   - Keep kebab-case props unchanged
   - Preserve `slot` attributes
   - Preserve ARIA and data attributes

5. **Generate Imports**

   ```tsx
   import { Component1, Component2, ... } from '@/components/ui';
   ```

6. **Generate Component Code**
   - Wrap in proper React component if needed
   - Add TypeScript types if `typescript: true`
   - Format with proper indentation

7. **Output**
   - Show complete, runnable React code
   - Include all necessary imports
   - Add explanatory comments for complex patterns

## Example Transformation

### Input (Web Awesome):

```html
<form style="max-width: 60ch; margin: auto">
  <wa-card>
    <div slot="header" id="comment-area-label">
      <span class="wa-heading-m">Leave a Comment</span>
    </div>
    <wa-textarea aria-labelledby="comment-area-label"></wa-textarea>
    <div slot="footer" class="wa-cluster wa-justify-content-end">
      <wa-button appearance="filled" size="small">
        <wa-icon slot="start" name="paperclip" variant="solid"></wa-icon>
        Attach a file
      </wa-button>
      <wa-button variant="brand" size="small">Comment</wa-button>
    </div>
  </wa-card>
</form>
```

### Output (Kigumi React):

```tsx
import { Button, Card, Icon, Textarea } from '@/components/ui';

export default function CommentForm() {
  return (
    <form style={{ maxWidth: '60ch', margin: 'auto' }}>
      <Card>
        <div slot="header" id="comment-area-label">
          <span className="wa-heading-m">Leave a Comment</span>
        </div>
        <Textarea aria-labelledby="comment-area-label" />
        <div slot="footer" className="wa-cluster wa-justify-content-end">
          <Button appearance="filled" size="small">
            <Icon slot="start" name="paperclip" variant="solid" />
            Attach a file
          </Button>
          <Button variant="brand" size="small">
            Comment
          </Button>
        </div>
      </Card>
    </form>
  );
}
```

## Advanced Patterns

### Complex Component with State

If the snippet requires state management:

```tsx
import { useState } from 'react';
import { Button, Card, Textarea } from '@/components/ui';

export default function CommentForm() {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Comment:', comment);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '60ch', margin: 'auto' }}>
      <Card>
        <div slot="header">
          <span className="wa-heading-m">Leave a Comment</span>
        </div>
        <Textarea
          value={comment}
          onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
        />
        <div slot="footer" className="wa-cluster wa-justify-content-end">
          <Button variant="brand" size="small" type="submit">
            Comment
          </Button>
        </div>
      </Card>
    </form>
  );
}
```

### With TypeScript Props Interface

```tsx
import { Button, Card, Icon, Textarea } from '@/components/ui';

interface CommentFormProps {
  onSubmit?: (comment: string) => void;
  placeholder?: string;
}

export default function CommentForm({
  onSubmit,
  placeholder,
}: CommentFormProps) {
  // ... implementation
}
```

## Edge Cases

### 1. Self-Closing Tags

```html
<!-- Web Awesome -->
<wa-icon name="star"></wa-icon>

<!-- Kigumi React -->
<Icon name="star" />
```

### 2. Multiple Class Names

```html
<!-- Web Awesome -->
<div class="wa-cluster wa-justify-content-end wa-gap-2">
  <!-- Kigumi React -->
  <div className="wa-cluster wa-justify-content-end wa-gap-2"></div>
</div>
```

### 3. Inline Styles

```html
<!-- Web Awesome -->
<form style="max-width: 60ch; margin: auto">

<!-- Kigumi React -->
<form style={{ maxWidth: '60ch', margin: 'auto' }}>
```

### 4. Boolean Attributes

```html
<!-- Web Awesome -->
<wa-button disabled loading>
  <!-- Kigumi React -->
  <button disabled loading></button
></wa-button>
```

### 5. Nested Slots

```html
<!-- Web Awesome -->
<wa-card>
  <div slot="header">
    <wa-icon slot="start" name="info"></wa-icon>
    <span>Title</span>
  </div>
</wa-card>

<!-- Kigumi React -->
<Card>
  <div slot="header">
    <Icon slot="start" name="info" />
    <span>Title</span>
  </div>
</Card>
```

## Validation

After transformation, ensure:

1. ✅ All Web Awesome components are mapped to Kigumi components
2. ✅ Imports match the config's alias settings
3. ✅ `class` is converted to `className`
4. ✅ Inline styles are converted to React style objects
5. ✅ Self-closing tags use JSX syntax (`/>`)
6. ✅ Component names are PascalCase
7. ✅ TypeScript types are included if `typescript: true`
8. ✅ Web Awesome utility classes (`wa-*`) are preserved

## Output Format

Always provide:

1. **Complete import statement** with all required components
2. **Functional component** (default export or named export)
3. **Proper formatting** with consistent indentation
4. **Brief explanation** of any complex transformations made
5. **Usage example** if the component accepts props

---

**Parent:** [.cursor/SKILLS.md](../.cursor/SKILLS.md)
