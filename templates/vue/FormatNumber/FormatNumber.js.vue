<script setup>
import { ref, onMounted, useAttrs } from 'vue';
import './FormatNumber.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-number/format-number.js'));
}

/**
 * Formats a number using the Intl.NumberFormat API
 */
const props = defineProps({
  value: { type: Number, required: false, default: 0 },
  type: { type: String, required: false, default: 'decimal' },
  currency: { type: String, required: false, default: 'USD' },
  'currency-display': { type: String, required: false, default: 'symbol' },
  'minimum-integer-digits': { type: Number, required: false },
  'minimum-fraction-digits': { type: Number, required: false },
  'maximum-fraction-digits': { type: Number, required: false },
  'minimum-significant-digits': { type: Number, required: false },
  'maximum-significant-digits': { type: Number, required: false },
  'without-grouping': { type: Boolean, required: false, default: false },
  lang: { type: String, required: false },
});

defineOptions({ inheritAttrs: false });

// Forward props and fallthrough attributes to the web component yourself,
// rather than through Vue's default fallthrough:
// - Web Awesome reads attribute presence as truthy, so `false` must never
//   reach <wa-*>. Vue materializes every absent optional Boolean prop as
//   `false`, and would render a fallthrough `false` as the string "false".
//   `aria-*` / `data-*` keep `false`, where "false" is a real value.
// - Vue camelizes declared prop keys (`with-caret` -> `withCaret`). Before
//   the element upgrades, that key lands as the attribute `withcaret`, which
//   Web Awesome never reads, so props go back to their kebab-case names.
// A plain function, not `computed`: `attrs` is tracked per property read,
// so a computed over an empty `attrs` would never see a later attribute.
const attrs = useAttrs();

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-format-number
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-format-number>
</template>
