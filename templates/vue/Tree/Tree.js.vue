<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Tree.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tree/tree.js'));
}

/**
 * Trees allow you to display a hierarchical list of selectable tree items
 */
const props = defineProps({
    selection: { type: String, required: false, default: 'single' }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['wa-selection-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaSelectionChange = (e) => emit('wa-selection-change', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-selection-change', handleWaSelectionChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-selection-change', handleWaSelectionChange);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-tree
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-tree>
</template>
