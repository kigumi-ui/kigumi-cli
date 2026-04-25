<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Carousel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/carousel/carousel.js'));
}

/**
 * Displays an arbitrary number of content slides along a horizontal or vertical axis
 */
export interface CarouselProps {
  autoplay?: boolean;
  'autoplay-interval'?: number;
  loop?: boolean;
  'mouse-dragging'?: boolean;
  navigation?: boolean;
  orientation?: 'horizontal' | 'vertical';
  pagination?: boolean;
  'slides-per-move'?: number;
  'slides-per-page'?: number;
}

const props = defineProps<CarouselProps>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'wa-slide-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaSlideChange = (e: Event) => emit('wa-slide-change', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-slide-change', handleWaSlideChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-slide-change', handleWaSlideChange);
});

defineExpose({
  previous: (behavior: ScrollBehavior) => (elementRef.value as any)?.previous?.(behavior),
  next: (behavior: ScrollBehavior) => (elementRef.value as any)?.next?.(behavior),
  goToSlide: (index: number, behavior: ScrollBehavior) => (elementRef.value as any)?.goToSlide?.(index, behavior),
  element: elementRef,
});
</script>

<template>
  <wa-carousel
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-carousel>
</template>
