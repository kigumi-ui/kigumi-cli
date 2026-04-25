<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './SplitPanel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/split-panel/split-panel.js'));
}

/**
 * Split panels display two adjacent panels with a divider for resizing
 */
const props = defineProps({
    position: { type: Number, required: false, default: 50 },
    'position-in-pixels': { type: Number, required: false },
    orientation: { type: String, required: false, default: 'horizontal' },
    primary: { type: String, required: false, default: 'start' },
    disabled: { type: Boolean, required: false, default: false },
    snap: { type: String, required: false },
    'snap-threshold': { type: Number, required: false, default: 12 }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['wa-reposition']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaReposition = (e) => emit('wa-reposition', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-reposition', handleWaReposition);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-reposition', handleWaReposition);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-split-panel
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-split-panel>
</template>
