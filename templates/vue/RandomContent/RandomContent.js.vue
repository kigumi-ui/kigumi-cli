<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './RandomContent.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/random-content/random-content.js'));
}

/**
 * Randomly selects and displays one or more of its child elements
 */
const props = defineProps({
  items: { type: Number, required: false, default: 1 },
  mode: { type: String, required: false, default: 'unique' },
  autoplay: { type: Boolean, required: false, default: false },
  'autoplay-interval': { type: Number, required: false, default: 3000 },
  animation: { type: String, required: false, default: 'none' },
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

const emit = defineEmits(['wa-content-change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaContentChange = (e) => emit('wa-content-change', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-content-change', handleWaContentChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-content-change', handleWaContentChange);
});

defineExpose({
  randomize: () => elementRef.value?.randomize?.(),
  element: elementRef,
});
</script>

<template>
  <wa-random-content
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-random-content>
</template>
