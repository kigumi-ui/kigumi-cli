<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './MutationObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js'));
}

/**
 * Observes changes to a target element and emits events when they occur
 */
const props = defineProps({
    attr: { type: String, required: false },
    'attr-old-value': { type: Boolean, required: false, default: false },
    'char-data': { type: Boolean, required: false, default: false },
    'char-data-old-value': { type: Boolean, required: false, default: false },
    'child-list': { type: Boolean, required: false, default: false },
    disabled: { type: Boolean, required: false, default: false },
    subtree: { type: Boolean, required: false, default: false }
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

const emit = defineEmits(['wa-mutation']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaMutation = (e) => emit('wa-mutation', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-mutation', handleWaMutation);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-mutation', handleWaMutation);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-mutation-observer
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-mutation-observer>
</template>
