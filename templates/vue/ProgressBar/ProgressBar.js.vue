<script setup>
import { ref, computed, onMounted } from 'vue';
import './ProgressBar.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js'));
}

/**
 * Progress bars are used to show the completion of a task or operation
 */
const props = defineProps({
    value: { type: Number, required: false, default: 0 },
    indeterminate: { type: Boolean, required: false, default: false },
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
  <wa-progress-bar
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-progress-bar>
</template>
