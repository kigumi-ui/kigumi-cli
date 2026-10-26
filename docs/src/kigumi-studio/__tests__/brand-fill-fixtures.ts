import { DEFAULT_VALUES } from '../lib/defaults';

/** Studio's default brand colour. */
export const DEFAULT_BRAND = DEFAULT_VALUES['--wa-color-brand'].light;

/**
 * The default brand and brands whose palette step 50, Web Awesome's brand
 * fill step, carries white text under 4.5:1.
 */
export const BRANDS_UNDER_AA_AT_STEP_50 = [
  DEFAULT_BRAND,
  '#0891b2',
  '#16a34a',
  '#ca8a04',
];
