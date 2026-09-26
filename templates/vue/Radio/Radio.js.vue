<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Radio.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/radio/radio.js'));
}

/**
 * Radios allow the user to select a single option from a group
 */
const props = defineProps({
  value: { type: String, required: false },
  disabled: { type: Boolean, required: false, default: false },
  size: { type: String, required: false, default: 'medium' },
  appearance: { type: String, required: false, default: 'default' },
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

const emit = defineEmits(['blur', 'focus']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
});

defineExpose({
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) =>
    elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-radio ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-radio>
</template>
