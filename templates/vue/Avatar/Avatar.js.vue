<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Avatar.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/avatar/avatar.js'));
}

/**
 * Avatars are used to represent a person or object
 */
const props = defineProps({
    image: { type: String, required: false, default: '' },
    label: { type: String, required: true, default: '' },
    initials: { type: String, required: false, default: '' },
    loading: { type: String, required: false, default: 'eager' },
    shape: { type: String, required: false, default: 'circle' }
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

const emit = defineEmits(['wa-error']);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaError = (e) => emit('wa-error', e);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-error', handleWaError);
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-error', handleWaError);
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-avatar
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-avatar>
</template>
