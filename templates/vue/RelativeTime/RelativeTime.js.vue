<script setup>
import { ref, computed, onMounted } from 'vue';
import './RelativeTime.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/relative-time/relative-time.js'));
}

/**
 * Outputs a localized time phrase relative to the current date and time
 */
const props = defineProps({
  date: { type: String, required: false },
  format: { type: String, required: false, default: 'long' },
  numeric: { type: String, required: false, default: 'auto' },
  sync: { type: Boolean, required: false, default: false },
  lang: { type: String, required: false },
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

const emit = defineEmits([]);

const elementRef = ref(null);

onMounted(() => {
  ensureLoaded();
});

defineExpose({
  element: elementRef,
});
</script>

<template>
  <wa-relative-time
    ref="elementRef"
    v-bind="definedProps"
    :class="$attrs.class"
  >
    <slot />
  </wa-relative-time>
</template>
