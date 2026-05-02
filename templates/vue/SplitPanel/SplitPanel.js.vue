<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './SplitPanel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/split-panel/split-panel.js'));
}

/**
 * Split panels display two adjacent panels with a divider for resizing
 */
const props = defineProps({
  position: { type: Number, required: false, default: 50 },
  'position-in-pixels': { type: Number, required: false },
  orientation: { type: String, required: false, default: 'horizontal' },
  primary: { type: String, required: false, default: 'start' },
  disabled: { type: Boolean, required: false, default: false },
  snap: { type: String, required: false },
  'snap-threshold': { type: Number, required: false, default: 12 },
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
  element: elementRef,
});
</script>

<template>
  <wa-split-panel ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-split-panel>
</template>
