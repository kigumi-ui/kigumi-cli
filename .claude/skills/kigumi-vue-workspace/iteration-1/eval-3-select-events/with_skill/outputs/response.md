# Eval 3: Select Component Events in Vue

The Kigumi Vue `<Select>` component emits both native DOM events and custom `wa-` prefixed events. Here is the full event reference and how to handle selection changes.

## All Select Events

| Event           | Vue Handler      | Type          | Description                                                 |
| --------------- | ---------------- | ------------- | ----------------------------------------------------------- |
| `input`         | `@input`         | `InputEvent`  | Fires on every value change (use this for reactive updates) |
| `change`        | `@change`        | `Event`       | Fires when the value change is "committed" by the user      |
| `focus`         | `@focus`         | `FocusEvent`  | Select gains focus                                          |
| `blur`          | `@blur`          | `FocusEvent`  | Select loses focus                                          |
| `wa-clear`      | `@wa-clear`      | `CustomEvent` | Clear button clicked (when `with-clear` is set)             |
| `wa-show`       | `@wa-show`       | `CustomEvent` | Listbox dropdown opens                                      |
| `wa-after-show` | `@wa-after-show` | `CustomEvent` | Open animation completes                                    |
| `wa-hide`       | `@wa-hide`       | `CustomEvent` | Listbox dropdown closes                                     |
| `wa-after-hide` | `@wa-after-hide` | `CustomEvent` | Close animation completes                                   |
| `wa-invalid`    | `@wa-invalid`    | `CustomEvent` | Validation constraint not satisfied                         |

## Handling Selection Changes

The primary event for tracking selection changes is `@input`. It fires a native `InputEvent`, so you access the value via `e.target`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select, Option } from '@/components/ui';

const selectedRole = ref('');

function handleInput(e: Event) {
  selectedRole.value = (e.target as HTMLSelectElement).value;
}
</script>

<template>
  <Select label="Role" @input="handleInput">
    <Option value="dev">Developer</Option>
    <Option value="design">Designer</Option>
    <Option value="pm">Product Manager</Option>
  </Select>

  <p>Selected: {{ selectedRole }}</p>
</template>
```

Or inline for brevity:

```vue
<Select
  label="Role"
  @input="(e: Event) => selectedRole = (e.target as HTMLSelectElement).value"
>
  <Option value="dev">Developer</Option>
  <Option value="design">Designer</Option>
</Select>
```

## Important: No v-model

Web Awesome components do **not** support Vue's `v-model`. This will not work:

```vue
<!-- BROKEN: v-model does not work on Kigumi components -->
<Select v-model="selectedRole">
```

Always use `:value` + `@input` instead.

## Multi-Select Example

When `multiple` is set, the value is a space-delimited string of selected values:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select, Option } from '@/components/ui';

const selectedSkills = ref('');

function handleInput(e: Event) {
  selectedSkills.value = (e.target as HTMLSelectElement).value;
}

// To get an array of selected values:
// selectedSkills.value.split(' ').filter(Boolean)
</script>

<template>
  <Select label="Skills" multiple @input="handleInput">
    <Option value="typescript">TypeScript</Option>
    <Option value="vue">Vue</Option>
    <Option value="react">React</Option>
    <Option value="css">CSS</Option>
  </Select>
</template>
```

## @input vs @change

- **`@input`** fires on every selection change, immediately. Use this for reactive UI updates.
- **`@change`** fires when the user commits a change (may behave slightly differently depending on interaction pattern). Use this for form submission or side effects you only want to trigger once.

For most use cases, `@input` is the right choice.

## Installation

```bash
npx kigumi add select
```

This also installs the required dependencies: `Icon`, `Option`, `Popup`, and `Tag`.
