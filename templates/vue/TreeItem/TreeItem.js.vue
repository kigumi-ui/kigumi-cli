<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './TreeItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tree-item/tree-item.js'));
}

/**
 * Tree items are used inside trees to represent hierarchical items
 */
const props = defineProps({
  expanded: { type: Boolean, required: false, default: false },
  selected: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  lazy: { type: Boolean, required: false, default: false },
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
  'wa-lazy-change',
  'wa-lazy-load',
]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaExpand = (e) => emit('wa-expand', e);
const handleWaAfterExpand = (e) => emit('wa-after-expand', e);
const handleWaCollapse = (e) => emit('wa-collapse', e);
const handleWaAfterCollapse = (e) => emit('wa-after-collapse', e);
const handleWaLazyChange = (e) => emit('wa-lazy-change', e);
const handleWaLazyLoad = (e) => emit('wa-lazy-load', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-expand', handleWaExpand);
  el.addEventListener('wa-after-expand', handleWaAfterExpand);
  el.addEventListener('wa-collapse', handleWaCollapse);
  el.addEventListener('wa-after-collapse', handleWaAfterCollapse);
  el.addEventListener('wa-lazy-change', handleWaLazyChange);
  el.addEventListener('wa-lazy-load', handleWaLazyLoad);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-expand', handleWaExpand);
  el.removeEventListener('wa-after-expand', handleWaAfterExpand);
  el.removeEventListener('wa-collapse', handleWaCollapse);
  el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
  el.removeEventListener('wa-lazy-change', handleWaLazyChange);
  el.removeEventListener('wa-lazy-load', handleWaLazyLoad);
});

defineExpose({
  getChildrenItems: (options) => elementRef.value?.getChildrenItems?.(options),
  element: elementRef,
});
</script>

<template>
  <wa-tree-item
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-tree-item>
</template>
