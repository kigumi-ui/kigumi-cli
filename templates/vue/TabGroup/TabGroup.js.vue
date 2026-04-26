<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './TabGroup.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-group/tab-group.js'));
}

/**
 * Tab groups organize content into a container that shows one section at a time
 */
const props = defineProps({
    placement: { type: String, required: false, default: 'top' },
    activation: { type: String, required: false, default: 'auto' },
    'without-scroll-controls': { type: Boolean, required: false, default: false },
    active: { type: String, required: false }
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

const emit = defineEmits(['wa-tab-show', 'wa-tab-hide']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaTabShow = (e) => emit('wa-tab-show', e);
const handleWaTabHide = (e) => emit('wa-tab-hide', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-tab-show', handleWaTabShow);
  el.addEventListener('wa-tab-hide', handleWaTabHide);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-tab-show', handleWaTabShow);
  el.removeEventListener('wa-tab-hide', handleWaTabHide);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-tab-group
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-tab-group>
</template>
