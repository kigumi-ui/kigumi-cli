<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Include.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/include/include.js'));
}

/**
 * Includes give you the power to embed external HTML files into the page
 */
const props = defineProps({
    src: { type: String, required: false },
    mode: { type: String, required: false, default: 'cors' },
    'allow-scripts': { type: Boolean, required: false, default: false }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

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

onUnmounted(() => {
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
  <wa-include
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-include>
</template>
