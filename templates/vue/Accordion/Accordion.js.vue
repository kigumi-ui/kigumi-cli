<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

onUnmounted(() => {
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
  <wa-accordion ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-accordion>
</template>
