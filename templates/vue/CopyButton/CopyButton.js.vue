<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './CopyButton.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/copy-button/copy-button.js'));
}

/**
 * Copies text data to the clipboard when clicked
 */
const props = defineProps({
  value: { type: String, required: false, default: '' },
  from: { type: String, required: false, default: '' },
  disabled: { type: Boolean, required: false, default: false },
  'copy-label': { type: String, required: false, default: '' },
  'success-label': { type: String, required: false, default: '' },
  'error-label': { type: String, required: false, default: '' },
  'feedback-duration': { type: Number, required: false, default: 1000 },
  'tooltip-placement': { type: String, required: false, default: 'top' },
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

const emit = defineEmits(['wa-copy', 'wa-error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaCopy = (e) => emit('wa-copy', e);
const handleWaError = (e) => emit('wa-error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-copy', handleWaCopy);
  el.addEventListener('wa-error', handleWaError);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-copy', handleWaCopy);
  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-copy-button
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-copy-button>
</template>
