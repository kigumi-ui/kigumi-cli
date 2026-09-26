<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Button.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/button/button.js'));
}

/**
 * Buttons represent actions that are available to the user
 */
const props = defineProps({
  variant: { type: String, required: false, default: 'neutral' },
  appearance: { type: String, required: false, default: 'filled' },
  size: { type: String, required: false, default: 'medium' },
  pill: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  loading: { type: Boolean, required: false, default: false },
  'with-caret': { type: Boolean, required: false, default: false },
  href: { type: String, required: false },
  target: { type: String, required: false },
  download: { type: String, required: false },
  rel: { type: String, required: false },
  type: { type: String, required: false, default: 'button' },
  name: { type: String, required: false },
  value: { type: String, required: false },
  formaction: { type: String, required: false },
  formenctype: { type: String, required: false },
  formmethod: { type: String, required: false },
  formnovalidate: { type: Boolean, required: false, default: false },
  formtarget: { type: String, required: false },
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

const emit = defineEmits(['blur', 'focus', 'wa-invalid']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleBlur = (e) => emit('blur', e);
const handleFocus = (e) => emit('focus', e);
const handleWaInvalid = (e) => emit('wa-invalid', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('blur', handleBlur);
  el.addEventListener('focus', handleFocus);
  el.addEventListener('wa-invalid', handleWaInvalid);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('focus', handleFocus);
  el.removeEventListener('wa-invalid', handleWaInvalid);
});

defineExpose({
  click: () => elementRef.value?.click?.(),
  focus: (options) => elementRef.value?.focus?.(options),
  blur: () => elementRef.value?.blur?.(),
  setCustomValidity: (message) =>
    elementRef.value?.setCustomValidity?.(message),
  formStateRestoreCallback: (state, reason) =>
    elementRef.value?.formStateRestoreCallback?.(state, reason),
  resetValidity: () => elementRef.value?.resetValidity?.(),
  element: elementRef,
});
</script>

<template>
  <wa-button ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-button>
</template>
