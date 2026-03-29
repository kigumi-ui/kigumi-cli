# Select Component Events in Vue

The Kigumi Vue `Select` component emits the following events:

## Events

| Event           | Payload       | Description                                                               |
| --------------- | ------------- | ------------------------------------------------------------------------- |
| `input`         | `CustomEvent` | Fires on every value change as the user interacts; also updates `v-model` |
| `change`        | `CustomEvent` | Fires when the selected value is committed/confirmed                      |
| `focus`         | `FocusEvent`  | Fires when the select receives focus                                      |
| `blur`          | `CustomEvent` | Fires when the select loses focus                                         |
| `wa-clear`      | `CustomEvent` | Fires when the clear button is clicked (requires `with-clear` prop)       |
| `wa-show`       | `CustomEvent` | Fires when the dropdown starts to open                                    |
| `wa-after-show` | `CustomEvent` | Fires after the dropdown has fully opened (after transitions)             |
| `wa-hide`       | `CustomEvent` | Fires when the dropdown starts to close                                   |
| `wa-after-hide` | `CustomEvent` | Fires after the dropdown has fully closed (after transitions)             |
| `wa-invalid`    | `CustomEvent` | Fires when the form validity check fails                                  |

## Handling Selection Changes

For selection changes, use either `input` or `change`:

- **`input`** fires on every interaction and is the event that drives `v-model`. Use this for reactive, live updates.
- **`change`** fires when the selection is committed. This mirrors the native `<select>` `change` behavior.

### Using v-model (recommended)

```vue
<script setup>
import { ref } from 'vue';
import { Select } from '@/components/ui/Select/Select.vue';

const selectedValue = ref('');
</script>

<template>
  <Select v-model="selectedValue" label="Choose an option">
    <wa-option value="a">Option A</wa-option>
    <wa-option value="b">Option B</wa-option>
    <wa-option value="c">Option C</wa-option>
  </Select>
  <p>Selected: {{ selectedValue }}</p>
</template>
```

### Listening to the `change` event directly

```vue
<script setup>
import { ref } from 'vue';

const selectedValue = ref('');

function handleChange(event) {
  console.log('New value:', event.target.value);
  selectedValue.value = event.target.value;
}
</script>

<template>
  <Select label="Choose an option" @change="handleChange">
    <wa-option value="a">Option A</wa-option>
    <wa-option value="b">Option B</wa-option>
    <wa-option value="c">Option C</wa-option>
  </Select>
</template>
```

### Listening to the `input` event directly

```vue
<template>
  <Select label="Choose an option" @input="(e) => console.log(e.target.value)">
    <wa-option value="a">Option A</wa-option>
    <wa-option value="b">Option B</wa-option>
  </Select>
</template>
```

## Notes

- `v-model` is the simplest approach for tracking selection state -- it is wired to the `input` event internally.
- The `wa-*` prefixed events (`wa-clear`, `wa-show`, `wa-after-show`, `wa-hide`, `wa-after-hide`, `wa-invalid`) are Web Awesome-specific events forwarded from the underlying `<wa-select>` element.
- For `multiple` mode, `event.target.value` will be an array of selected values.
