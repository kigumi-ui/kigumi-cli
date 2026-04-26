<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './IntersectionObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js'));
}

/**
 * Observes changes in the intersection of a target element with an ancestor
 */
const props = defineProps({
    disabled: { type: Boolean, required: false, default: false },
    once: { type: Boolean, required: false, default: false },
    threshold: { type: String, required: false, default: '0' },
    'root-margin': { type: String, required: false, default: '0px' },
    'intersect-class': { type: String, required: false }
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

const emit = defineEmits(['wa-intersect']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaIntersect = (e) => emit('wa-intersect', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-intersect', handleWaIntersect);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-intersect', handleWaIntersect);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-intersection-observer
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-intersection-observer>
</template>
