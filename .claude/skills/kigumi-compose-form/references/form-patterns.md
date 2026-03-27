# Form Patterns

Complete form patterns with React and Vue code.

## Pattern A: Contact Form

Simple form with text inputs and textarea.

**Components needed:** `npx kigumi add input textarea button callout`

### React

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Callout, Input, Textarea } from '@/components/ui';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData(e.currentTarget);
      await fetch('/api/contact', { method: 'POST', body: data });
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="wa-stack wa-gap-l" style={{ maxWidth: '60ch' }} onSubmit={handleSubmit}>
      {error && <Callout variant="danger">{error}</Callout>}

      <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
        <Input label="First name" name="firstName" required />
        <Input label="Last name" name="lastName" required />
      </div>

      <Input label="Email" name="email" type="email" required />
      <Textarea label="Message" name="message" rows={4} required resize="auto" />

      <div className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" type="reset">Clear</Button>
        <Button variant="brand" type="submit" loading={loading}>Send Message</Button>
      </div>
    </form>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Callout, Input, Textarea } from '@/components/ui';

const loading = ref(false);
const error = ref('');

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  error.value = '';
  try {
    const data = new FormData(e.currentTarget as HTMLFormElement);
    await fetch('/api/contact', { method: 'POST', body: data });
  } catch {
    error.value = 'Failed to send message. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="wa-stack wa-gap-l" style="max-width: 60ch" @submit="handleSubmit">
    <Callout v-if="error" variant="danger">{{ error }}</Callout>

    <div class="wa-grid" style="--min-column-size: 200px">
      <Input label="First name" name="firstName" required />
      <Input label="Last name" name="lastName" required />
    </div>

    <Input label="Email" name="email" type="email" required />
    <Textarea label="Message" name="message" :rows="4" required resize="auto" />

    <div class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" type="reset">Clear</Button>
      <Button variant="brand" type="submit" :loading="loading">Send Message</Button>
    </div>
  </form>
</template>
```

---

## Pattern B: Login Form

Login with email, password, remember-me, and error display.

**Components needed:** `npx kigumi add input checkbox button callout`

### React

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Callout, Checkbox, Input } from '@/components/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
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

      {error && (
        <Callout variant="danger">{error}</Callout>
      )}

      <Input
        label="Email"
        type="email"
        required
        onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
      />

      <Input
        label="Password"
        type="password"
        required
        password-toggle
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
      />

      <Checkbox
        onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
      >
        Remember me
      </Checkbox>

      <Button variant="brand" type="submit" loading={loading} style={{ width: '100%' }}>
        Sign In
      </Button>
    </form>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Callout, Checkbox, Input } from '@/components/ui';

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
      body: JSON.stringify({ email: email.value, password: password.value, remember: remember.value }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    window.location.href = '/dashboard';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="wa-stack wa-gap-l" style="max-width: 400px; margin: 0 auto" @submit="handleSubmit">
    <h1 style="text-align: center">Sign In</h1>
    <Callout v-if="error" variant="danger">{{ error }}</Callout>
    <Input label="Email" type="email" required @input="(e: Event) => email = (e.target as HTMLInputElement).value" />
    <Input label="Password" type="password" required password-toggle @input="(e: Event) => password = (e.target as HTMLInputElement).value" />
    <Checkbox @change="(e: Event) => remember = (e.target as HTMLInputElement).checked">Remember me</Checkbox>
    <Button variant="brand" type="submit" :loading="loading" style="width: 100%">Sign In</Button>
  </form>
</template>
```

---

## Pattern C: Settings Form

Grouped settings with multiple control types, organized by tabs and collapsible sections.

**Components needed:** `npx kigumi add input select option switch radio-group radio details tab-group tab tab-panel button divider`

### React

```tsx
import { type FormEvent } from 'react';
import {
  Button, Details, Divider, Input, Option, Radio, RadioGroup,
  Select, Switch, Tab, TabGroup, TabPanel,
} from '@/components/ui';

export function SettingsPage() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    console.log(Object.fromEntries(data));
  };

  return (
    <form className="wa-stack wa-gap-l" style={{ maxWidth: '800px' }} onSubmit={handleSubmit}>
      <h1>Settings</h1>

      <TabGroup>
        <Tab slot="nav" panel="profile">Profile</Tab>
        <Tab slot="nav" panel="preferences">Preferences</Tab>
        <Tab slot="nav" panel="notifications">Notifications</Tab>

        <TabPanel name="profile">
          <div className="wa-stack wa-gap-m">
            <Details summary="Personal Information" open>
              <div className="wa-stack wa-gap-m">
                <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
                  <Input label="First name" name="firstName" />
                  <Input label="Last name" name="lastName" />
                </div>
                <Input label="Email" name="email" type="email" />
                <Input label="Phone" name="phone" type="tel" />
              </div>
            </Details>

            <Details summary="Bio">
              <Input label="Job title" name="jobTitle" />
            </Details>
          </div>
        </TabPanel>

        <TabPanel name="preferences">
          <div className="wa-stack wa-gap-m">
            <Select label="Language" name="language">
              <Option value="en">English</Option>
              <Option value="de">Deutsch</Option>
              <Option value="ja">Japanese</Option>
            </Select>

            <Select label="Timezone" name="timezone">
              <Option value="utc">UTC</Option>
              <Option value="est">Eastern</Option>
              <Option value="pst">Pacific</Option>
            </Select>

            <RadioGroup label="Theme" name="theme" value="system">
              <Radio value="light">Light</Radio>
              <Radio value="dark">Dark</Radio>
              <Radio value="system">System</Radio>
            </RadioGroup>
          </div>
        </TabPanel>

        <TabPanel name="notifications">
          <div className="wa-stack wa-gap-m">
            <Switch name="emailNotifs" checked>Email notifications</Switch>
            <Switch name="pushNotifs">Push notifications</Switch>
            <Switch name="weeklyDigest" checked>Weekly digest</Switch>
          </div>
        </TabPanel>
      </TabGroup>

      <Divider />

      <div className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" type="reset">Reset</Button>
        <Button variant="brand" type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import {
  Button, Details, Divider, Input, Option, Radio, RadioGroup,
  Select, Switch, Tab, TabGroup, TabPanel,
} from '@/components/ui';

function handleSubmit(e: Event) {
  e.preventDefault();
  const data = new FormData(e.currentTarget as HTMLFormElement);
  console.log(Object.fromEntries(data));
}
</script>

<template>
  <form class="wa-stack wa-gap-l" style="max-width: 800px" @submit="handleSubmit">
    <h1>Settings</h1>

    <TabGroup>
      <Tab slot="nav" panel="profile">Profile</Tab>
      <Tab slot="nav" panel="preferences">Preferences</Tab>
      <Tab slot="nav" panel="notifications">Notifications</Tab>

      <TabPanel name="profile">
        <div class="wa-stack wa-gap-m">
          <Details summary="Personal Information" open>
            <div class="wa-stack wa-gap-m">
              <div class="wa-grid" style="--min-column-size: 200px">
                <Input label="First name" name="firstName" />
                <Input label="Last name" name="lastName" />
              </div>
              <Input label="Email" name="email" type="email" />
            </div>
          </Details>
        </div>
      </TabPanel>

      <TabPanel name="preferences">
        <div class="wa-stack wa-gap-m">
          <Select label="Language" name="language">
            <Option value="en">English</Option>
            <Option value="de">Deutsch</Option>
          </Select>
          <RadioGroup label="Theme" name="theme" value="system">
            <Radio value="light">Light</Radio>
            <Radio value="dark">Dark</Radio>
            <Radio value="system">System</Radio>
          </RadioGroup>
        </div>
      </TabPanel>

      <TabPanel name="notifications">
        <div class="wa-stack wa-gap-m">
          <Switch name="emailNotifs" checked>Email notifications</Switch>
          <Switch name="pushNotifs">Push notifications</Switch>
        </div>
      </TabPanel>
    </TabGroup>

    <Divider />
    <div class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" type="reset">Reset</Button>
      <Button variant="brand" type="submit">Save Changes</Button>
    </div>
  </form>
</template>
```

---

## Pattern D: Multi-Step Wizard

Step-by-step form with validation per step.

**Components needed:** `npx kigumi add input select option checkbox button tab-group tab tab-panel progress-bar`

### React

```tsx
import { useState, type FormEvent } from 'react';
import {
  Button, Checkbox, Input, Option, ProgressBar, Select,
  Tab, TabGroup, TabPanel,
} from '@/components/ui';

export function SignupWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const steps = ['Account', 'Profile', 'Confirm'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    const data = new FormData(e.currentTarget as HTMLFormElement);
    await fetch('/api/signup', { method: 'POST', body: data });
    setLoading(false);
  };

  return (
    <form className="wa-stack wa-gap-l" style={{ maxWidth: '500px' }} onSubmit={handleSubmit}>
      <ProgressBar value={(step / (steps.length - 1)) * 100} label={`Step ${step + 1} of ${steps.length}`}>
        {steps[step]}
      </ProgressBar>

      {step === 0 && (
        <div className="wa-stack wa-gap-m">
          <Input label="Email" name="email" type="email" required />
          <Input label="Password" name="password" type="password" required minlength={8} password-toggle />
          <Input label="Confirm password" name="confirmPassword" type="password" required />
        </div>
      )}

      {step === 1 && (
        <div className="wa-stack wa-gap-m">
          <Input label="Full name" name="fullName" required />
          <Select label="Role" name="role">
            <Option value="developer">Developer</Option>
            <Option value="designer">Designer</Option>
            <Option value="manager">Manager</Option>
          </Select>
        </div>
      )}

      {step === 2 && (
        <div className="wa-stack wa-gap-m">
          <p>Review your information and confirm.</p>
          <Checkbox name="terms" required>
            I agree to the Terms of Service
          </Checkbox>
        </div>
      )}

      <div className="wa-cluster wa-justify-content-space-between">
        <Button
          variant="neutral"
          type="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>
        <Button variant="brand" type="submit" loading={loading}>
          {step < steps.length - 1 ? 'Next' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  Button, Checkbox, Input, Option, ProgressBar, Select,
} from '@/components/ui';

const step = ref(0);
const loading = ref(false);
const steps = ['Account', 'Profile', 'Confirm'];

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (step.value < steps.length - 1) {
    step.value++;
    return;
  }
  loading.value = true;
  const data = new FormData(e.currentTarget as HTMLFormElement);
  await fetch('/api/signup', { method: 'POST', body: data });
  loading.value = false;
}
</script>

<template>
  <form class="wa-stack wa-gap-l" style="max-width: 500px" @submit="handleSubmit">
    <ProgressBar :value="(step / (steps.length - 1)) * 100" :label="`Step ${step + 1} of ${steps.length}`">
      {{ steps[step] }}
    </ProgressBar>

    <div v-if="step === 0" class="wa-stack wa-gap-m">
      <Input label="Email" name="email" type="email" required />
      <Input label="Password" name="password" type="password" required :minlength="8" password-toggle />
    </div>

    <div v-if="step === 1" class="wa-stack wa-gap-m">
      <Input label="Full name" name="fullName" required />
      <Select label="Role" name="role">
        <Option value="developer">Developer</Option>
        <Option value="designer">Designer</Option>
      </Select>
    </div>

    <div v-if="step === 2" class="wa-stack wa-gap-m">
      <p>Review your information and confirm.</p>
      <Checkbox name="terms" required>I agree to the Terms of Service</Checkbox>
    </div>

    <div class="wa-cluster wa-justify-content-space-between">
      <Button variant="neutral" type="button" :disabled="step === 0" @click="step--">Back</Button>
      <Button variant="brand" type="submit" :loading="loading">
        {{ step < steps.length - 1 ? 'Next' : 'Create Account' }}
      </Button>
    </div>
  </form>
</template>
```

---

## Styling Form Controls

Override form control appearance globally via CSS custom properties:

```css
:root {
  /* Layout */
  --wa-form-control-height: 2.5rem;
  --wa-form-control-padding-block: 0.5rem;
  --wa-form-control-padding-inline: 0.75rem;
  --wa-form-control-toggle-size: 1.125rem;

  /* Borders */
  --wa-form-control-border-color: var(--wa-color-surface-border);
  --wa-form-control-border-style: solid;
  --wa-form-control-border-width: 1px;
  --wa-form-control-border-radius: var(--wa-border-radius-m);

  /* Colors */
  --wa-form-control-background-color: var(--wa-color-surface-base);
  --wa-form-control-activated-color: var(--wa-color-brand-normal);

  /* Label */
  --wa-form-control-label-color: var(--wa-color-text-normal);
  --wa-form-control-label-font-weight: var(--wa-font-weight-semibold);
  --wa-form-control-label-line-height: 1.5;

  /* Value */
  --wa-form-control-value-color: var(--wa-color-text-normal);
  --wa-form-control-value-font-weight: var(--wa-font-weight-normal);
  --wa-form-control-value-line-height: 1.5;

  /* Hint & placeholder */
  --wa-form-control-hint-color: var(--wa-color-text-quiet);
  --wa-form-control-placeholder-color: var(--wa-color-text-quiet);

  /* Required indicator */
  --wa-form-control-required-content: '*';
  --wa-form-control-required-color: var(--wa-color-danger-normal);
  --wa-form-control-required-offset: 0.125rem;
}
```

For component-specific styling, use `::part()`:

```css
wa-input::part(base) {
  background: var(--wa-color-surface-raised);
}

wa-select::part(combobox) {
  border-radius: var(--wa-border-radius-l);
}
```

---

## Form Control Slots

Form components expose slots for customizing content areas. Use `slot="name"` to place elements.

### Input Slots

| Slot | Description |
|------|-------------|
| `start` | Icon or element before the input value |
| `end` | Icon or element after the input value |
| `label` | Custom label content (alternative to `label` prop) |
| `hint` | Custom hint content (alternative to `hint` prop) |
| `clear-icon` | Custom clear icon |
| `show-password-icon` | Custom show-password icon |
| `hide-password-icon` | Custom hide-password icon |

### Select Slots

| Slot | Description |
|------|-------------|
| `start` | Icon or element at start of combobox |
| `end` | Icon or element at end of combobox |
| `label` | Custom label content |
| `hint` | Custom hint content |
| `clear-icon` | Custom clear icon |
| `expand-icon` | Custom expand/collapse icon |

### Slot Examples

```tsx
// React: Input with prefix and suffix icons
import { Icon, Input } from '@/components/ui';

<Input label="Search" type="search">
  <Icon slot="start" name="search" />
  <Icon slot="end" name="x-circle" />
</Input>

// Input with custom label
<Input>
  <span slot="label">Email <small>(required)</small></span>
</Input>
```

```vue
<!-- Vue: Input with prefix and suffix icons -->
<Input label="Search" type="search">
  <Icon slot="start" name="search" />
  <Icon slot="end" name="x-circle" />
</Input>
```

See the enriched component references for full slot, part, and event details:
- [Input reference](../../kigumi-react/references/components/input.md)
- [Select reference](../../kigumi-react/references/components/select.md)

---

## Success State

After a successful form submission, provide feedback to the user. Common approaches:

**Option 1: Inline success Callout** (for forms that stay visible)

```tsx
const [success, setSuccess] = useState(false);

// In submit handler, after successful response:
setSuccess(true);
(e.currentTarget as HTMLFormElement).reset();

// In JSX:
{success && <Callout variant="success">Your message has been sent.</Callout>}
```

**Option 2: Toast notification** (for forms in dialogs or settings pages)

Use the Toast component from the `compose-overlay` skill for non-blocking success feedback. See [compose-overlay Toast pattern](../../kigumi-compose-overlay/references/overlay-patterns.md) for the full implementation.

```tsx
// After successful submit, trigger a toast:
import { toast } from '@/lib/toast'; // see compose-overlay for setup

await submitForm(data);
toast('Changes saved successfully.', { variant: 'success' });
```

**Option 3: Redirect** (for login/signup flows)

```tsx
// After successful auth:
window.location.href = '/dashboard';
```

---

## react-hook-form Integration

Kigumi form controls emit native DOM events, not React synthetic events. To integrate with `react-hook-form`, use `Controller` to bridge the gap:

```tsx
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Select, Option } from '@/components/ui';

interface FormValues {
  email: string;
  role: string;
}

function ControlledForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => console.log(data);

  return (
    <form className="wa-stack wa-gap-m" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } }}
        render={({ field }) => (
          <Input
            label="Email"
            type="email"
            value={field.value}
            hint={errors.email?.message}
            onInput={(e) => field.onChange((e.target as HTMLInputElement).value)}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        name="role"
        control={control}
        rules={{ required: 'Please select a role' }}
        render={({ field }) => (
          <Select
            label="Role"
            value={field.value}
            hint={errors.role?.message}
            onInput={(e) => field.onChange((e.target as HTMLSelectElement).value)}
            onBlur={field.onBlur}
          >
            <Option value="developer">Developer</Option>
            <Option value="designer">Designer</Option>
          </Select>
        )}
      />

      <Button variant="brand" type="submit">Save</Button>
    </form>
  );
}
```

Key points:
- Use `Controller`, not `register` (web components do not expose a native `ref` that RHF can attach to)
- Read values from `e.target` in `onInput`/`onChange`, not from `e.detail`
- Pass `errors.fieldName?.message` to the `hint` prop for inline validation display
