<script setup>
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Popup.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/popup/popup.js'));
}

/**
 * Popup is a utility component for positioning elements relative to an anchor
 */
const props = defineProps({
  active: { type: Boolean, required: false, default: false },
  anchor: { type: String, required: false },
  placement: { type: String, required: false, default: 'top' },
  strategy: { type: String, required: false, default: 'absolute' },
  distance: { type: Number, required: false, default: 0 },
  skidding: { type: Number, required: false, default: 0 },
  arrow: { type: Boolean, required: false, default: false },
  'arrow-placement': { type: String, required: false, default: 'anchor' },
  'arrow-padding': { type: Number, required: false, default: 10 },
  flip: { type: Boolean, required: false, default: false },
  'flip-fallback-placements': { type: String, required: false },
  'flip-fallback-strategy': {
    type: String,
    required: false,
    default: 'best-fit',
  },
  'flip-padding': { type: Number, required: false, default: 0 },
  shift: { type: Boolean, required: false, default: false },
  'shift-padding': { type: Number, required: false, default: 0 },
  'auto-size': { type: String, required: false },
  sync: { type: String, required: false },
  'auto-size-padding': { type: Number, required: false, default: 0 },
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

const emit = defineEmits(['wa-reposition']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaReposition = (e) => emit('wa-reposition', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-reposition', handleWaReposition);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-reposition', handleWaReposition);
});

defineExpose({
  reposition: () => elementRef.value?.reposition?.(),
  element: elementRef,
});
</script>

<template>
  <wa-popup ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-popup>
</template>
