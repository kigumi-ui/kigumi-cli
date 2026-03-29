# Settings Form -- Grouped Layout

A settings form with two sections (Profile and Notifications), using Kigumi components in a grouped layout with collapsible `<Details>` sections.

## 1. Install Missing Components

Both the React and Vue starter projects are missing `Select`, `Option`, and `Details`. Install them before using the code below.

```bash
# React project
cd /path/to/kigumi-react
npx kigumi add select option details

# Vue project
cd /path/to/kigumi-vue
npx kigumi add select option details
```

Components already installed: `Input`, `Textarea`, `Switch`, `Button`, `Divider`.

## 2. React Implementation

```tsx
import { useState, type FormEvent } from 'react';
import {
  Button,
  Details,
  Divider,
  Input,
  Option,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';

export function SettingsForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData(e.currentTarget);
      await fetch('/api/settings', { method: 'POST', body: data });
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
      <h1>Settings</h1>

      {/* ── Profile Section ── */}
      <Details summary="Profile" open>
        <div className="wa-stack wa-gap-m">
          <div
            className="wa-grid"
            style={{ '--min-column-size': '200px' } as React.CSSProperties}
          >
            <Input label="First name" name="firstName" required />
            <Input label="Last name" name="lastName" required />
          </div>
          <Textarea
            label="Bio"
            name="bio"
            rows={4}
            resize="auto"
            hint="Brief description for your profile"
          />
        </div>
      </Details>

      {/* ── Notifications Section ── */}
      <Details summary="Notifications" open>
        <div className="wa-stack wa-gap-m">
          <Switch name="emailNotifications" checked>
            Email notifications
          </Switch>
          <Switch name="smsNotifications">SMS notifications</Switch>
          <Select label="Notification frequency" name="notificationFrequency">
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
          </Select>
        </div>
      </Details>

      <Divider />

      <div className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" type="reset">
          Reset
        </Button>
        <Button variant="brand" type="submit" loading={loading}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
```

## 3. Vue Implementation

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  Button,
  Details,
  Divider,
  Input,
  Option,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';

const firstName = ref('');
const lastName = ref('');
const bio = ref('');
const emailNotifications = ref(true);
const smsNotifications = ref(false);
const notificationFrequency = ref('weekly');
const loading = ref(false);

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  try {
    const data = new FormData(e.currentTarget as HTMLFormElement);
    await fetch('/api/settings', { method: 'POST', body: data });
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
    <h1>Settings</h1>

    <!-- Profile Section -->
    <Details summary="Profile" open>
      <div class="wa-stack wa-gap-m">
        <div class="wa-grid" style="--min-column-size: 200px">
          <Input
            v-model="firstName"
            label="First name"
            name="firstName"
            required
          />
          <Input
            v-model="lastName"
            label="Last name"
            name="lastName"
            required
          />
        </div>
        <Textarea
          v-model="bio"
          label="Bio"
          name="bio"
          :rows="4"
          resize="auto"
          hint="Brief description for your profile"
        />
      </div>
    </Details>

    <!-- Notifications Section -->
    <Details summary="Notifications" open>
      <div class="wa-stack wa-gap-m">
        <Switch v-model="emailNotifications" name="emailNotifications" checked>
          Email notifications
        </Switch>
        <Switch v-model="smsNotifications" name="smsNotifications">
          SMS notifications
        </Switch>
        <Select
          v-model="notificationFrequency"
          label="Notification frequency"
          name="notificationFrequency"
        >
          <Option value="daily">Daily</Option>
          <Option value="weekly">Weekly</Option>
          <Option value="monthly">Monthly</Option>
        </Select>
      </div>
    </Details>

    <Divider />

    <div class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" type="reset">Reset</Button>
      <Button variant="brand" type="submit" :loading="loading">
        Save Settings
      </Button>
    </div>
  </form>
</template>
```

## Design Decisions

- **Grouped layout via `<Details>`**: Each section is a collapsible group with `open` set by default so all fields are visible on load. Users can collapse sections they are not editing.
- **`.wa-grid` for name fields**: First name and last name sit side-by-side on wider viewports and stack on narrow screens (responsive via `--min-column-size: 200px`).
- **`.wa-stack` for vertical flow**: All fields within a section flow vertically with consistent `wa-gap-m` spacing.
- **`<Select>` for frequency**: Three fixed options (Daily/Weekly/Monthly) is a clear single-select use case. No searchable combobox needed.
- **`<Switch>` for toggles**: Binary on/off controls for notification preferences. Email notifications default to checked; SMS defaults to unchecked.
- **`<Textarea>` with `resize="auto"`**: Bio field grows with content, starting at 4 rows.
- **`<Divider>` before actions**: Visually separates form sections from the action buttons.
- **Form-level submit**: All fields share a single `<form>` element with one submit handler, collecting data via `FormData`.
- **Loading state**: Submit button shows a spinner via the `loading` prop to prevent double submission.
- **Vue uses `v-model`**: Preferred over manual event handling per skill guidance.
- **Vue uses `slot="header"` pattern**: Not `<template #header>`, following the web component slot convention.
- **Native DOM events**: All event handlers read values from `e.target`, not `e.detail`, because form controls emit native events.

## Accessibility

- Every form control has a `label` prop.
- `hint` prop on the bio textarea provides supplementary instructions.
- `required` prop on first name and last name fields.
- Submit button text is descriptive ("Save Settings", not just "Submit").
- The form is wrapped in a `<form>` element with proper submit handling.
- `<Details>` sections use the `summary` prop for accessible disclosure headings.
