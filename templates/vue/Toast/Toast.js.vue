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
