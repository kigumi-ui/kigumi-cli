<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import './RandomContent.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/random-content/random-content.js'));
}

/**
 * Randomly selects and displays one or more of its child elements
 */
export interface RandomContentProps {
  items?: number;
  mode?: 'random' | 'unique' | 'sequence';
  autoplay?: boolean;
  'autoplay-interval'?: number;
  animation?:
    'none' | 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right';
}

const props = defineProps<RandomContentProps>();

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
  'wa-content-change': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaContentChange = (e: Event) =>
  emit('wa-content-change', e as CustomEvent);

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
  randomize: () => (elementRef.value as any)?.randomize?.(),
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
