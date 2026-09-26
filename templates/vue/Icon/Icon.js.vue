<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Icon.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/icon/icon.js'));
}

/**
 * Icons are symbols that can be used to represent various options within an application
 */
const props = defineProps({
  name: { type: String, required: false },
  library: { type: String, required: false, default: 'default' },
  src: { type: String, required: false },
  label: { type: String, required: false, default: '' },
  family: { type: String, required: false },
  variant: { type: String, required: false },
  canvas: { type: String, required: false },
  'auto-width': { type: Boolean, required: false, default: false },
  'swap-opacity': { type: Boolean, required: false, default: false },
  rotate: { type: Number, required: false },
  flip: { type: String, required: false },
  animation: { type: String, required: false },
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

const emit = defineEmits(['wa-load', 'wa-error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaLoad = (e) => emit('wa-load', e);
const handleWaError = (e) => emit('wa-error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-load', handleWaLoad);
  el.addEventListener('wa-error', handleWaError);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-load', handleWaLoad);
  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-icon ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-icon>
</template>
