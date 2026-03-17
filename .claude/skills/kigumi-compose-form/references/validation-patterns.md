# Validation Patterns

Form validation patterns for Kigumi form controls.

## Native HTML Validation

Web Awesome form controls support native constraint validation via props:

| Prop | Purpose | Components |
|------|---------|-----------|
| `required` | Field must have a value | All form controls |
| `minlength` | Minimum character count | Input, Textarea |
| `maxlength` | Maximum character count | Input, Textarea |
| `pattern` | Regex the value must match | Input |
| `min` | Minimum numeric/date value | Input (number/date), Slider |
| `max` | Maximum numeric/date value | Input (number/date), Slider |
| `step` | Valid increment | Input (number), Slider |

```tsx
// React: native validation via props
<Input label="Username" required minlength={3} maxlength={20} pattern="[a-zA-Z0-9_]+" />
<Input label="Email" type="email" required />
<Input label="Age" type="number" min={18} max={120} />
<Slider label="Volume" min={0} max={100} step={5} />
```

## Visual Error States

Web Awesome form controls expose custom states for CSS styling. These
appear **only after user interaction**, not immediately on page load.

**Custom states:**
- `:state(required)` / `:state(optional)`
- `:state(invalid)` / `:state(valid)`
- `:state(user-invalid)` / `:state(user-valid)` (after interaction)

**Browser pseudo-classes also work:** `:required`, `:optional`, `:invalid`, `:valid`, `:user-invalid`, `:user-valid`

Kigumi components use `.ComponentName` as their CSS class (e.g., `.Input`, `.Select`, `.Checkbox`).

```css
/* Style invalid Input after user interaction */
.Input:state(user-invalid)::part(base) {
  border-color: var(--wa-color-danger-border-normal);
}

/* Style valid Input after user interaction */
.Input:state(user-valid)::part(base) {
  border-color: var(--wa-color-success-border-normal);
}
```

Web Awesome themes handle basic validation styling automatically. Custom
CSS is only needed for advanced visual feedback.

## Custom Validation

For validation logic beyond HTML constraints, use `setCustomValidity()` on the
web component element:

### React

```tsx
import { useRef } from 'react';
import { Input, Button } from '@/components/ui';

function PasswordForm() {
  const confirmRef = useRef<HTMLElement>(null);

  const validateConfirm = (e: Event) => {
    const form = (e.target as HTMLElement).closest('form');
    const password = form?.querySelector<HTMLInputElement>('[name="password"]');
    const confirm = confirmRef.current as HTMLInputElement | null;

    if (confirm && password && confirm.value !== password.value) {
      confirm.setCustomValidity('Passwords do not match');
    } else {
      confirm?.setCustomValidity('');
    }
  };

  return (
    <form className="wa-stack wa-gap-m">
      <Input label="Password" name="password" type="password" required minlength={8} />
      <Input
        ref={confirmRef}
        label="Confirm password"
        name="confirmPassword"
        type="password"
        required
        onInput={validateConfirm}
      />
      <Button variant="brand" type="submit">Update</Button>
    </form>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref as templateRef } from 'vue';
import { Input, Button } from '@/components/ui';

const confirmEl = templateRef<HTMLElement>();

function validateConfirm(e: Event) {
  const form = (e.target as HTMLElement).closest('form');
  const password = form?.querySelector<HTMLInputElement>('[name="password"]');
  const confirm = confirmEl.value as HTMLInputElement | null;
  if (confirm && password && confirm.value !== password.value) {
    confirm.setCustomValidity('Passwords do not match');
  } else {
    confirm?.setCustomValidity('');
  }
}
</script>

<template>
  <form class="wa-stack wa-gap-m">
    <Input label="Password" name="password" type="password" required :minlength="8" />
    <Input ref="confirmEl" label="Confirm password" type="password" required @input="validateConfirm" />
    <Button variant="brand" type="submit">Update</Button>
  </form>
</template>
```

## Async Validation

Debounced server-side validation (e.g., username availability):

### React

```tsx
import { useRef, useState } from 'react';
import { Input } from '@/components/ui';

function UsernameField() {
  const [hint, setHint] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLElement>(null);

  const checkUsername = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    clearTimeout(timerRef.current);

    if (value.length < 3) {
      setHint('Username must be at least 3 characters');
      return;
    }

    setHint('Checking availability...');
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-username?u=${value}`);
      const { available } = await res.json();
      const el = inputRef.current as HTMLInputElement | null;

      if (available) {
        setHint('Username is available');
        el?.setCustomValidity('');
      } else {
        setHint('Username is taken');
        el?.setCustomValidity('Username is already taken');
      }
    }, 500);
  };

  return (
    <Input
      ref={inputRef}
      label="Username"
      hint={hint}
      required
      minlength={3}
      onInput={checkUsername}
    />
  );
}
```

## Error Display Patterns

### Field-Level Errors

Use the `hint` prop for inline error messages:

```tsx
<Input
  label="Email"
  type="email"
  required
  hint={error ? 'Please enter a valid email address' : 'We will never share your email'}
/>
```

### Form-Level Errors

Use `Callout` for errors that affect the entire form:

```tsx
{error && (
  <Callout variant="danger">
    <strong>Submission failed</strong><br />
    {error}
  </Callout>
)}
```

## Submit Handling

### Using FormData API

```tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const res = await fetch('/api/submit', { method: 'POST', body: data });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.message || 'Submission failed');
    }

    // Success: redirect, show toast, or reset form
    (e.currentTarget as HTMLFormElement).reset();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

### Loading State on Button

```tsx
<Button variant="brand" type="submit" loading={loading} disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</Button>
```

The `loading` prop shows a spinner and prevents double-submit automatically.
