<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import type WaCarouselItem from '@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js';
import './Carousel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/carousel/carousel.js'));
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

defineOptions({ inheritAttrs: false });

// Forward props and fallthrough attributes to the web component yourself,
// rather than through Vue's default fallthrough:
// - Web Awesome reads attribute presence as truthy, so `false` must never
//   reach <wa-*>. Vue materializes every absent optional Boolean prop as
//   `false`, and would render a fallthrough `false` as the string "false".
//   `aria-*` / `data-*` keep `false`, where "false" is a real value.
// - Vue camelizes declared prop keys (`with-caret` -> `withCaret`). Before
//   the element upgrades, that key lands as the attribute `withcaret`, which
//   Web Awesome never reads, so props go back to their kebab-case names.
// A plain function, not `computed`: `attrs` is tracked per property read,
// so a computed over an empty `attrs` would never see a later attribute.
const attrs = useAttrs();

function hostAttributes(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits<{
  'wa-slide-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaSlideChange = (e: Event) =>
  emit('wa-slide-change', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-slide-change', handleWaSlideChange);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-slide-change', handleWaSlideChange);
});

defineExpose({
  previous: (behavior: ScrollBehavior) =>
    (elementRef.value as any)?.previous?.(behavior),
  next: (behavior: ScrollBehavior) =>
    (elementRef.value as any)?.next?.(behavior),
  addSlide: (slide: WaCarouselItem) =>
    (elementRef.value as any)?.addSlide?.(slide),
  removeSlide: (index: number) =>
    (elementRef.value as any)?.removeSlide?.(index),
  goToSlide: (index: number, behavior: ScrollBehavior) =>
    (elementRef.value as any)?.goToSlide?.(index, behavior),
  element: elementRef,
});
</script>

<template>
  <wa-carousel ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-carousel>
</template>
