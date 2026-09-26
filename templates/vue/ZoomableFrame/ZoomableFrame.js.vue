<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './ZoomableFrame.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js'));
}

/**
 * Zoomable frames display iframe content with zoom controls
 */
const props = defineProps({
  src: { type: String, required: false },
  srcdoc: { type: String, required: false },
  zoom: { type: Number, required: false, default: 1 },
  'zoom-levels': {
    type: String,
    required: false,
    default: '25% 50% 75% 100% 125% 150% 175% 200%',
  },
  allowfullscreen: { type: Boolean, required: false, default: false },
  loading: { type: String, required: false, default: 'eager' },
  'without-controls': { type: Boolean, required: false, default: false },
  'without-interaction': { type: Boolean, required: false, default: false },
  sandbox: { type: String, required: false },
  referrerpolicy: { type: String, required: false },
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

const emit = defineEmits(['load', 'error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleLoad = (e) => emit('load', e);
const handleError = (e) => emit('error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('load', handleLoad);
  el.addEventListener('error', handleError);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('load', handleLoad);
  el.removeEventListener('error', handleError);
});

defineExpose({
  zoomIn: () => elementRef.value?.zoomIn?.(),
  zoomOut: () => elementRef.value?.zoomOut?.(),
  element: elementRef,
});
</script>

<template>
  <wa-zoomable-frame
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-zoomable-frame>
</template>
