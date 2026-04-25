<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Carousel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/carousel/carousel.js'));
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
    'slides-per-page': { type: Number, required: false, default: 1 }
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

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

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-slide-change', handleWaSlideChange);
});

defineExpose({
  previous: (behavior) => elementRef.value?.previous?.(behavior),
  next: (behavior) => elementRef.value?.next?.(behavior),
  goToSlide: (index, behavior) => elementRef.value?.goToSlide?.(index, behavior),
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
