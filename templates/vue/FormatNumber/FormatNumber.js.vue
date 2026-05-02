<script setup>
import { ref, computed, onMounted } from 'vue';
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

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

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
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-format-number>
</template>
