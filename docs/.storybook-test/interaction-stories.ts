/**
 * The single source of truth for which stories the interaction-test lane runs.
 *
 * WHY THIS FILE EXISTS: this list was maintained by hand in two places that
 * must agree, `.storybook-test/main.ts` (`stories`) and
 * `vitest.storybook.config.ts` (`server.warmup.clientFiles`). Adding a story
 * to one and forgetting the other is silent: the lane either skips the story
 * or races the Vite deps optimizer. Both files now derive their list from
 * here, so the two cannot drift apart.
 *
 * WHAT BELONGS HERE: only stories tagged for the interaction lane. Untagged
 * stories (e.g. ToastItem, ProgressRing) are deliberately excluded because
 * their iframe handshake flakes in headless CI.
 *
 * The paths are relative to `docs/src/stories/`; each consumer prefixes them
 * for its own base directory.
 */
export const INTERACTION_STORIES = [
  'Accordion',
  'AccordionItem',
  'Button',
  'ButtonGroup',
  'Carousel',
  'Checkbox',
  'ColorPicker',
  'Combobox',
  'CopyButton',
  'Details',
  'Dialog',
  'Drawer',
  'Dropdown',
  'Input',
  'NumberInput',
  'Popover',
  'ProgressBar',
  'Radio',
  'RadioGroup',
  'Rating',
  'Select',
  'Slider',
  'SplitPanel',
  'Switch',
  'TabGroup',
  'Tag',
  'Textarea',
  'Tooltip',
  'Tree',
] as const;

/**
 * Builds the story-file paths for one consumer.
 *
 * @param prefix Path to `src/stories/`, relative to the consumer's own file.
 */
export function interactionStoryPaths(prefix: string): string[] {
  return INTERACTION_STORIES.map((name) => `${prefix}${name}.stories.tsx`);
}
