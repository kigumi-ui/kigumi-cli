<script setup>
import { ref, computed, onMounted } from 'vue';
import './Toast.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/toast/toast.js'));
}

/**
 * Container that manages and stacks lightweight notification banners at a chosen screen edge
 */
const props = defineProps({
    placement: { type: String, required: false, default: 'top-end' }
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
  create: (message, options) => elementRef.value?.create?.(message, options),
  element: elementRef,
});
</script>

<template>
  <wa-toast
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-toast>
</template>
