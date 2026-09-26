<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Carousel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/carousel/carousel.js'));
}

/**
 * Displays an arbitrary number of content slides along a horizontal or vertical axis
 */
const props = defineProps({
  autoplay: { type: Boolean, required: false, default: false },
  'autoplay-interval': { type: Number, required: false, default: 3000 },
  loop: { type: Boolean, required: false, default: false },
  'mouse-dragging': { type: Boolean, required: false, default: false },
  navigation: { type: Boolean, required: false, default: false },
  orientation: { type: String, required: false, default: 'horizontal' },
  pagination: { type: Boolean, required: false, default: false },
  'slides-per-move': { type: Number, required: false, default: 1 },
  'slides-per-page': { type: Number, required: false, default: 1 },
});

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

function hostAttributes() {
  const result = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits(['wa-slide-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaSlideChange = (e) => emit('wa-slide-change', e);

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
  previous: (behavior) => elementRef.value?.previous?.(behavior),
  next: (behavior) => elementRef.value?.next?.(behavior),
  addSlide: (slide) => elementRef.value?.addSlide?.(slide),
  removeSlide: (index) => elementRef.value?.removeSlide?.(index),
  goToSlide: (index, behavior) =>
    elementRef.value?.goToSlide?.(index, behavior),
  element: elementRef,
});
</script>

<template>
  <wa-carousel ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-carousel>
</template>
