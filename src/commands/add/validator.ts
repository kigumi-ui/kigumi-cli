/**
 * Component Validation Logic
 *
 * Validates components exist and are available for user's tier
 */

import {
  hasComponent,
  getComponent,
  getComponentNames,
} from '../../utils/registry.js';
import { isComponentAvailable } from '../../utils/tier-restrictions.js';
import { ValidationError } from '../../errors/validation.js';
import { TierRestrictionError } from '../../errors/tier.js';
import type { OutputInterface } from '../../output/types.js';

/**
 * Validate components
 *
 * @param components - Component names to validate
 * @param tier - User's tier (free/pro)
 * @param output - Output interface
 * @throws ValidationError if components don't exist
 * @throws TierRestrictionError if components require Pro tier
 */
export async function validateComponents(
  components: string[],
  tier: 'free' | 'pro',
  _output: OutputInterface
): Promise<void> {
  // Check if components exist
  const invalidComponents = components.filter((name) => !hasComponent(name));
  if (invalidComponents.length > 0) {
    throw new ValidationError(
      'components',
      invalidComponents.join(', '),
      getComponentNames()
    );
  }

  // Check tier restrictions
  const unavailableComponents = components.filter(
    (name) => !isComponentAvailable(name, tier)
  );

  if (unavailableComponents.length > 0) {
    const componentList = unavailableComponents
      .map((name) => {
        const component = getComponent(name);
        return component?.name || name;
      })
      .join(', ');

    // Phase 6: Show warning before error (let npm handle 401)
    _output.warning(
      `Pro-only component(s) detected: ${componentList}\n\n` +
        `These components require a Web Awesome Pro token.\n` +
        `The installation will fail without a valid token.\n\n` +
        `Get your token from: https://webawesome.com/account/tokens\n` +
        `Add to your .env file: WEBAWESOME_NPM_TOKEN=your_token_here`
    );

    throw new TierRestrictionError(componentList, 'pro', tier);
  }
}
