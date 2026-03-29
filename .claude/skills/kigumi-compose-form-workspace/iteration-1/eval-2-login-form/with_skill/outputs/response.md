# Login Form

A login form with email/password fields, "Remember me" switch, "Forgot password?" link, and password visibility toggle.

## Install Missing Components

Both projects already have `Input`, `Switch`, and `Button` installed. You need to add `Callout` for form-level error display:

```bash
npx kigumi add callout
```

## React Implementation

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Callout, Input, Switch } from '@/components/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      if (!res.ok) throw new Error('Invalid email or password');
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="wa-stack wa-gap-l"
      style={{ maxWidth: '400px', margin: '0 auto' }}
      onSubmit={handleSubmit}
    >
      <h1 style={{ textAlign: 'center' }}>Sign In</h1>

      {error && <Callout variant="danger">{error}</Callout>}

      <Input
        label="Email"
        name="email"
        type="email"
        required
        onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        required
        password-toggle
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
      />

      <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
        <Switch
          onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
        >
          Remember me
        </Switch>
        <a
          href="/forgot-password"
          style={{ fontSize: 'var(--wa-font-size-s)' }}
        >
          Forgot password?
        </a>
      </div>

      <Button
        variant="brand"
        type="submit"
        loading={loading}
        style={{ width: '100%' }}
      >
        Sign In
      </Button>
    </form>
  );
}
```

## Vue Implementation

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Callout, Input, Switch } from '@/components/ui';

const email = ref('');
const password = ref('');
const remember = ref(false);
const loading = ref(false);
const error = ref('');

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        remember: remember.value,
      }),
    });
    if (!res.ok) throw new Error('Invalid email or password');
    window.location.href = '/dashboard';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form
    class="wa-stack wa-gap-l"
    style="max-width: 400px; margin: 0 auto"
    @submit="handleSubmit"
  >
    <h1 style="text-align: center">Sign In</h1>

    <Callout v-if="error" variant="danger">{{ error }}</Callout>

    <Input v-model="email" label="Email" name="email" type="email" required />

    <Input
      v-model="password"
      label="Password"
      name="password"
      type="password"
      required
      password-toggle
    />

    <div
      class="wa-cluster wa-justify-content-space-between wa-align-items-center"
    >
      <Switch v-model="remember">Remember me</Switch>
      <a href="/forgot-password" style="font-size: var(--wa-font-size-s)">
        Forgot password?
      </a>
    </div>

    <Button
      variant="brand"
      type="submit"
      :loading="loading"
      style="width: 100%"
    >
      Sign In
    </Button>
  </form>
</template>
```

## How It Works

**Form controls used:**

| Field         | Component | Key Props                                        |
| ------------- | --------- | ------------------------------------------------ |
| Email         | `Input`   | `type="email"`, `required`                       |
| Password      | `Input`   | `type="password"`, `required`, `password-toggle` |
| Remember me   | `Switch`  | Children text as label                           |
| Error display | `Callout` | `variant="danger"`                               |
| Submit        | `Button`  | `variant="brand"`, `loading`                     |

**Key details:**

- The `password-toggle` prop on the password Input adds a built-in show/hide eye icon button. No custom implementation needed.
- The Switch uses a native `change` event. In React, read `(e.target as HTMLInputElement).checked`. In Vue, `v-model` handles it automatically.
- The "Forgot password?" link is a plain `<a>` element. Update the `href` to match your routing setup (e.g., `/forgot-password`, or use your router's Link component).
- Form-level errors display in a `Callout` with `variant="danger"` above the fields.
- The `loading` prop on the submit Button shows a spinner and prevents double-submission during the async request.
- Layout uses `.wa-stack` for vertical field spacing and `.wa-cluster` to place the Switch and link side-by-side.
- All form controls have `label` props and the required fields have the `required` prop, satisfying WCAG 2.1 AA accessibility requirements.
- Vue uses `v-model` for two-way binding (the preferred pattern for Kigumi Vue wrappers), while React uses `onInput` with `e.target` value access (native DOM events, not CustomEvent).
