<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Animation.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/animation/animation.js'));
}

/**
 * Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes
 */
const props = defineProps({
  name: { type: String, required: false, default: 'none' },
  play: { type: Boolean, required: false, default: false },
  delay: { type: Number, required: false, default: 0 },
  direction: { type: String, required: false, default: 'normal' },
  duration: { type: Number, required: false, default: 1000 },
  easing: { type: String, required: false, default: 'linear' },
  'end-delay': { type: Number, required: false, default: 0 },
  fill: { type: String, required: false, default: 'auto' },
  iterations: { type: Number, required: false, default: Infinity },
  'iteration-start': { type: Number, required: false, default: 0 },
  'playback-rate': { type: Number, required: false, default: 1 },
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

const emit = defineEmits(['wa-cancel', 'wa-finish', 'wa-start']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaCancel = (e) => emit('wa-cancel', e);
const handleWaFinish = (e) => emit('wa-finish', e);
const handleWaStart = (e) => emit('wa-start', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-cancel', handleWaCancel);
  el.addEventListener('wa-finish', handleWaFinish);
  el.addEventListener('wa-start', handleWaStart);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-cancel', handleWaCancel);
  el.removeEventListener('wa-finish', handleWaFinish);
  el.removeEventListener('wa-start', handleWaStart);
});

defineExpose({
  cancel: () => elementRef.value?.cancel?.(),
  finish: () => elementRef.value?.finish?.(),
  element: elementRef,
});
</script>

<template>
  <wa-animation ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-animation>
</template>
