<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Include.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/include/include.js'));
}

/**
 * Includes give you the power to embed external HTML files into the page
 */
const props = defineProps({
  src: { type: String, required: false },
  mode: { type: String, required: false, default: 'cors' },
  'allow-scripts': { type: Boolean, required: false, default: false },
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

const emit = defineEmits(['wa-load', 'wa-include-error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaLoad = (e) => emit('wa-load', e);
const handleWaIncludeError = (e) => emit('wa-include-error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-load', handleWaLoad);
  el.addEventListener('wa-include-error', handleWaIncludeError);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-load', handleWaLoad);
  el.removeEventListener('wa-include-error', handleWaIncludeError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-include ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-include>
</template>
