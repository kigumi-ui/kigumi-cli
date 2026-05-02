<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

onUnmounted(() => {
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
  <wa-popup ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-popup>
</template>
