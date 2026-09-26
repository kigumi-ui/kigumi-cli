<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Accordion.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion/accordion.js'));
}

/**
 * Accordions group related disclosure panels and control how many can be open at once
 */
const props = defineProps({
  mode: { type: String, required: false, default: 'multiple' },
  'icon-placement': { type: String, required: false, default: 'end' },
  'heading-level': { type: String, required: false, default: '3' },
  appearance: { type: String, required: false, default: 'outlined' },
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

const emit = defineEmits([
  'wa-expand',
  'wa-after-expand',
  'wa-collapse',
  'wa-after-collapse',
]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaExpand = (e) => emit('wa-expand', e);
const handleWaAfterExpand = (e) => emit('wa-after-expand', e);
const handleWaCollapse = (e) => emit('wa-collapse', e);
const handleWaAfterCollapse = (e) => emit('wa-after-collapse', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-expand', handleWaExpand);
  el.addEventListener('wa-after-expand', handleWaAfterExpand);
  el.addEventListener('wa-collapse', handleWaCollapse);
  el.addEventListener('wa-after-collapse', handleWaAfterCollapse);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-expand', handleWaExpand);
  el.removeEventListener('wa-after-expand', handleWaAfterExpand);
  el.removeEventListener('wa-collapse', handleWaCollapse);
  el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
});

defineExpose({
  expandAll: () => elementRef.value?.expandAll?.(),
  collapseAll: () => elementRef.value?.collapseAll?.(),
  element: elementRef,
});
</script>

<template>
  <wa-accordion
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-accordion>
</template>
