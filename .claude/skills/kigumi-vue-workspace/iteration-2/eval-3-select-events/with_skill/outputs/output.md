# Select Component Events in Kigumi Vue

The Kigumi Vue `<Select>` component (`wa-select`) emits the following events:

## Events

| Event           | Vue Syntax       | Type         | When It Fires                                                               |
| --------------- | ---------------- | ------------ | --------------------------------------------------------------------------- |
| `input`         | `@input`         | Native Event | Every time the value changes (as user interacts)                            |
| `change`        | `@change`        | Native Event | When the value changes and the control loses focus / selection is committed |
| `focus`         | `@focus`         | Native Event | When the select receives focus                                              |
| `blur`          | `@blur`          | Native Event | When the select loses focus                                                 |
| `wa-clear`      | `@wa-clear`      | CustomEvent  | When the clear button is clicked (requires `with-clear` prop)               |
| `wa-show`       | `@wa-show`       | CustomEvent  | When the dropdown starts to open                                            |
| `wa-after-show` | `@wa-after-show` | CustomEvent  | After the dropdown open animation completes                                 |
| `wa-hide`       | `@wa-hide`       | CustomEvent  | When the dropdown starts to close                                           |
| `wa-after-hide` | `@wa-after-hide` | CustomEvent  | After the dropdown close animation completes                                |
| `wa-invalid`    | `@wa-invalid`    | CustomEvent  | When form validation fails                                                  |

## Handling Selection Changes

For selection changes, use `@input` (fires on every change) or `@change` (fires on commit). Access the selected value via `e.target`:

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import { Select, Option } from '@/components/ui';

const form = reactive({
  role: '',
});

function handleSelectionChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  console.log('Selected:', value);
}
</script>

<template>
  <Select
    label="Role"
    @input="(e: Event) => (form.role = (e.target as HTMLSelectElement).value)"
    @change="handleSelectionChange"
  >
    <Option value="dev">Developer</Option>
    <Option value="design">Designer</Option>
    <Option value="pm">Product Manager</Option>
  </Select>
</template>
```

## `@input` vs `@change`

- **`@input`** -- fires immediately when the user selects an option. Use this for reactive updates (e.g., binding to form state).
- **`@change`** -- fires when the selection is committed. Use this for side effects like API calls or validation.

For most form binding scenarios, `@input` is the right choice.

## Multi-Select

When using `multiple`, the value is a space-delimited string of selected option values:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Select, Option } from '@/components/ui';

const selected = ref('');

function handleMultiSelect(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  // value is space-delimited, e.g. "dev design"
  const selectedValues = value.split(' ').filter(Boolean);
  console.log('Selected:', selectedValues);
}
</script>

<template>
  <Select
    label="Skills"
    multiple
    :max-options-visible="3"
    with-clear
    @input="handleMultiSelect"
    @wa-clear="() => (selected = '')"
  >
    <Option value="dev">Development</Option>
    <Option value="design">Design</Option>
    <Option value="pm">Product Management</Option>
    <Option value="qa">Quality Assurance</Option>
  </Select>
</template>
```

## Dropdown Open/Close Events

To react to the dropdown opening or closing (e.g., for lazy loading options):

```vue
<Select
  label="Category"
  @wa-show="loadOptions"
  @wa-after-hide="resetSearch"
  @input="(e: Event) => form.category = (e.target as HTMLSelectElement).value"
>
  <Option v-for="opt in options" :key="opt.value" :value="opt.value">
    {{ opt.label }}
  </Option>
</Select>
```

## Install

If Select is not yet in your project:

```bash
npx kigumi add select option
```

Both `Select` and `Option` are required. `Option` defines the selectable items within the Select.
