<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Comparison.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/comparison/comparison.js'));
}

/**
 * Compare visual differences between similar content with a sliding panel
 */
const props = defineProps({
  position: { type: Number, required: false, default: 50 },
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

const emit = defineEmits(['change']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleChange = (e) => emit('change', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('change', handleChange);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('change', handleChange);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-comparison ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-comparison>
</template>
