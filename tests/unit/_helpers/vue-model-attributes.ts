/**
 * Vue Templates that expose a `v-model`, keyed by registry key, with the CEM
 * attribute that model carries: the Template declares `modelValue` in place
 * of that attribute's prop. Pinned as committed data, not read from the
 * generator: a derived map would follow a generator that bound the model to
 * the wrong attribute. `vue-function-harness-registry.test.ts` asserts both
 * directions, so a Template that gains or loses `modelValue` must edit this
 * map in the same commit. Shared with `template-registry-props.test.ts`.
 */
export const VUE_MODEL_ATTRIBUTE: Readonly<
  Record<string, 'value' | 'checked'>
> = {
  checkbox: 'checked',
  'color-picker': 'value',
  combobox: 'value',
  input: 'value',
  'number-input': 'value',
  'otp-input': 'value',
  'radio-group': 'value',
  rating: 'value',
  select: 'value',
  slider: 'value',
  switch: 'checked',
  'tag-input': 'value',
  textarea: 'value',
};
