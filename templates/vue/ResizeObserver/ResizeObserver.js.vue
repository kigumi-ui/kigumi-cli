<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './ResizeObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js'));
}

/**
 * Reports changes to the dimensions of an element
 */
const props = defineProps({
    disabled: { type: Boolean, required: false, default: false }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(['wa-resize']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaResize = (e) => emit('wa-resize', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-resize', handleWaResize);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-resize', handleWaResize);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-resize-observer
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-resize-observer>
</template>
