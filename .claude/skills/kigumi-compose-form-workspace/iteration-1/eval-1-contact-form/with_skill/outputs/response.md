# Contact Form

## Install Missing Components

Both the React and Vue starter repos already have `Input`, `Textarea`, and `Button` installed. You need to add `Callout` for form-level error display:

```bash
npx kigumi add callout
```

---

## React Implementation

**File:** `src/components/examples/ContactForm.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Callout, Input, Textarea } from '@/components/ui';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = new FormData(e.currentTarget);
      await fetch('/api/contact', {
        method: 'POST',
        body: data,
      });
      setSuccess(true);
      (e.currentTarget as HTMLFormElement).reset();
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="wa-stack wa-gap-l"
      style={{ maxWidth: '60ch' }}
      onSubmit={handleSubmit}
    >
      <h2>Contact Us</h2>

      {error && <Callout variant="danger">{error}</Callout>}
      {success && (
        <Callout variant="success">
          Your message has been sent. We will get back to you soon.
        </Callout>
      )}

      <Input label="Name" name="name" required hint="Your full name" />

      <Input
        label="Email"
        name="email"
        type="email"
        required
        hint="We will never share your email"
      />

      <Textarea
        label="Message"
        name="message"
        rows={4}
        resize="auto"
        hint="How can we help you?"
      />

      <div className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" type="reset">
          Clear
        </Button>
        <Button variant="brand" type="submit" loading={loading}>
          Send Message
        </Button>
      </div>
    </form>
  );
}
```

---

## Vue Implementation

**File:** `src/components/examples/ContactForm.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Callout, Input, Textarea } from '@/components/ui';

const loading = ref(false);
const error = ref('');
const success = ref(false);

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  error.value = '';
  success.value = false;

  try {
    const data = new FormData(e.currentTarget as HTMLFormElement);
    await fetch('/api/contact', {
      method: 'POST',
      body: data,
    });
    success.value = true;
    (e.currentTarget as HTMLFormElement).reset();
  } catch {
    error.value = 'Failed to send message. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form
    class="wa-stack wa-gap-l"
    style="max-width: 60ch"
    @submit="handleSubmit"
  >
    <h2>Contact Us</h2>

    <Callout v-if="error" variant="danger">{{ error }}</Callout>
    <Callout v-if="success" variant="success">
      Your message has been sent. We will get back to you soon.
    </Callout>

    <Input label="Name" name="name" required hint="Your full name" />

    <Input
      label="Email"
      name="email"
      type="email"
      required
      hint="We will never share your email"
    />

    <Textarea
      label="Message"
      name="message"
      :rows="4"
      resize="auto"
      hint="How can we help you?"
    />

    <div class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" type="reset">Clear</Button>
      <Button variant="brand" type="submit" :loading="loading"
        >Send Message</Button
      >
    </div>
  </form>
</template>
```

---

## How It Works

### Validation

- **Name** uses the `required` prop. The browser prevents submission until a value is entered. After the user interacts and leaves the field empty, Web Awesome applies `:state(user-invalid)` styling automatically.
- **Email** uses both `required` and `type="email"`. The `type="email"` attribute provides built-in email format validation via the browser's constraint validation API -- the user must enter a valid email address (contains `@`, has a domain portion, etc.).
- **Message** has no `required` prop, so it is optional.

All validation states are visual only after user interaction (not on initial page load), thanks to Web Awesome's `:state(user-invalid)` custom state.

### Loading State

The submit `Button` receives the `loading` prop, which:

1. Shows a spinner animation inside the button
2. Prevents double-submission (the button ignores clicks while loading)
3. Visually communicates to the user that work is in progress

### Form Data Collection

Uses the native `FormData` API via `new FormData(e.currentTarget)`, reading values from each field's `name` attribute. This works with Web Awesome form controls because they participate in native form submission.

### Error Handling

- **Form-level errors** display in a `Callout variant="danger"` above the fields
- **Success feedback** uses `Callout variant="success"` and resets the form

### Accessibility

- Every form control has a `label` prop (visible label, automatically associated)
- The `hint` prop provides supplementary instructions for each field
- `required` fields display an asterisk indicator via `--wa-form-control-required-content`
- The form is wrapped in a semantic `<form>` element
- Submit button has descriptive text ("Send Message") rather than generic "Submit"
