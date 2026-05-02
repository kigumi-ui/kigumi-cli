<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './IntersectionObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js'));
}

/**
 * Observes changes in the intersection of a target element with an ancestor
 */
export interface IntersectionObserverProps {
  disabled?: boolean;
  once?: boolean;
  threshold?: string;
  'root-margin'?: string;
  'intersect-class'?: string;
}

const props = defineProps<IntersectionObserverProps>();

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'wa-intersect': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaIntersect = (e: Event) => emit('wa-intersect', e as CustomEvent);

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
