<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './Avatar.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/avatar/avatar.js'));
}

/**
 * Avatars are used to represent a person or object
 */
export interface AvatarProps {
  image?: string;
  label: string;
  initials?: string;
  loading?: 'eager' | 'lazy';
  shape?: 'circle' | 'square' | 'rounded';
}

const props = defineProps<AvatarProps>();

// Strip undefined and false props before forwarding to the web component.
// Vue boolean-prop coercion materializes absent optional Boolean props as
// `false`, but Web Awesome elements read attribute presence as truthy, so
// we must not forward `false` to <wa-*> (would render pill="" / loading="").
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value !== undefined && value !== false) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
  'wa-error': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaError = (e: Event) => emit('wa-error', e as CustomEvent);

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
  <wa-avatar ref="elementRef" v-bind="definedProps" :class="$attrs.class">
    <slot />
  </wa-avatar>
</template>
