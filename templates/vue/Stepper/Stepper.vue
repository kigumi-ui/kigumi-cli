<script setup lang="ts">
import { ref, onMounted, useAttrs, onBeforeUnmount } from 'vue';
import type WaStepper from '@awesome.me/webawesome/dist/components/stepper/stepper.js';
import type { WaBeforeStepChangeEvent } from '@awesome.me/webawesome/dist/events/before-step-change.js';
import type { WaStepChangeEvent } from '@awesome.me/webawesome/dist/events/step-change.js';
import './Stepper.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/stepper/stepper.js'));
}

/**
 * Steppers walk users through a multi-stage process and show where they are in it
 */
export interface StepperProps {
  active?: string;
  orientation?: 'horizontal' | 'vertical' | 'auto';
  linear?: boolean;
  clickable?: boolean;
  label?: string;
}

const props = defineProps<StepperProps>();

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
  'wa-before-step-change': [event: WaBeforeStepChangeEvent];
  'wa-step-change': [event: WaStepChangeEvent];
}>();

const elementRef = ref<WaStepper | null>(null);

onMounted(() => {
  ensureLoaded();
});

const handleWaBeforeStepChange = (e: Event) =>
  emit('wa-before-step-change', e as WaBeforeStepChangeEvent);
const handleWaStepChange = (e: Event) =>
  emit('wa-step-change', e as WaStepChangeEvent);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

  el.addEventListener('wa-before-step-change', handleWaBeforeStepChange);
  el.addEventListener('wa-step-change', handleWaStepChange);
});

onBeforeUnmount(() => {
  const el = elementRef.value;
  if (!el) return;

  el.removeEventListener('wa-before-step-change', handleWaBeforeStepChange);
  el.removeEventListener('wa-step-change', handleWaStepChange);
});

defineExpose({
  goTo: (name: string) => elementRef.value?.goTo?.(name),
  next: () => elementRef.value?.next?.(),
  previous: () => elementRef.value?.previous?.(),
  element: elementRef,
});
</script>

<template>
  <wa-stepper ref="elementRef" v-bind="hostAttributes()" :class="$attrs.class">
    <slot />
  </wa-stepper>
</template>
