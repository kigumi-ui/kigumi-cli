<script setup>
import { ref, computed, onMounted } from 'vue';
import './Skeleton.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/skeleton/skeleton.js'));
}

/**
 * Skeletons are used to provide a visual representation of where content will eventually load
 */
const props = defineProps({
    effect: { type: String, required: false, default: 'none' }
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
  element: elementRef,
});
</script>

<template>
  <wa-skeleton
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-skeleton>
</template>
