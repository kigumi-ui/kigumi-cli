<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

onUnmounted(() => {
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
  <wa-tree-item ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-tree-item>
</template>
