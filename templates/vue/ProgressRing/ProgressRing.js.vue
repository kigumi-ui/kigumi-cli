<script setup>
import { ref, computed, onMounted } from 'vue';
import './ProgressRing.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js'));
}

/**
 * Progress rings are used to show the completion of a task in a circular format
 */
const props = defineProps({
    value: { type: Number, required: false, default: 0 },
    label: { type: String, required: false, default: '' }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-progress-ring
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-progress-ring>
</template>
