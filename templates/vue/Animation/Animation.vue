<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import './Animation.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/animation/animation.js'));
}

/**
 * Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes
 */
export interface AnimationProps {
  name?: string;
  play?: boolean;
  delay?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  duration?: number;
  easing?: string;
  'end-delay'?: number;
  fill?: 'auto' | 'backwards' | 'both' | 'forwards' | 'none';
  iterations?: number;
  'iteration-start'?: number;
  'playback-rate'?: number;
}

const props = defineProps<AnimationProps>();

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

function hostAttributes(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') continue;
    if (value === false && !/^(aria|data)-/.test(key)) continue;
    result[key] = value;
  }
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (value === undefined || value === false) continue;
    result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;
  }
  return result;
}

const emit = defineEmits<{
  'wa-cancel': [event: CustomEvent];
  'wa-finish': [event: CustomEvent];
  'wa-start': [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaCancel = (e: Event) => emit('wa-cancel', e as CustomEvent);
const handleWaFinish = (e: Event) => emit('wa-finish', e as CustomEvent);
const handleWaStart = (e: Event) => emit('wa-start', e as CustomEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-cancel', handleWaCancel);
  el.addEventListener('wa-finish', handleWaFinish);
  el.addEventListener('wa-start', handleWaStart);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-cancel', handleWaCancel);
  el.removeEventListener('wa-finish', handleWaFinish);
  el.removeEventListener('wa-start', handleWaStart);
});

defineExpose({
  cancel: () => (elementRef.value as any)?.cancel?.(),
  finish: () => (elementRef.value as any)?.finish?.(),
  element: elementRef,
});
</script>

<template>
  <wa-animation
    ref="elementRef"
    v-bind="hostAttributes()"
    :class="$attrs.class"
  >
    <slot />
  </wa-animation>
</template>
