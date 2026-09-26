<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
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

onBeforeUnmount(() => {
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
  <wa-animation
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-animation>
</template>
