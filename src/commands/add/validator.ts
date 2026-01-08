/**
 * Component Validation Logic
 *
 * Validates components exist and are available for user's tier
 */

import pc from 'picocolors';
import { hasComponent, getComponent } from '../../utils/registry.js';
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
  output: OutputInterface
): Promise<void> {
  // Check if components exist
  const invalidComponents = components.filter(name => !hasComponent(name));
  if (invalidComponents.length > 0) {
    throw new ValidationError(
      'components',
      invalidComponents,
      undefined,
      undefined,
      [
        {
          title: 'View available components',
          steps: ['Run: kigumi list'],
        },
      ]
    );
  }

  // Check tier restrictions
  const unavailableComponents = components.filter(
    name => !isComponentAvailable(name, tier)
  );

  if (unavailableComponents.length > 0) {
    const componentList = unavailableComponents
      .map(name => {
        const component = getComponent(name);
        return component?.name || name;
      })
      .join(', ');

    throw new TierRestrictionError(
      'component',
      unavailableComponents,
      [
        {
          title: 'Upgrade to Pro',
          steps: [
            'Run: kigumi init',
            'Select "Pro" tier',
            'Enter your Web Awesome Pro token',
          ],
        },
        {
          title: 'Get a Pro token',
          steps: [
            'Visit: https://webawesome.com',
            'Sign up for Pro plan',
            'Copy your token from Settings → API Tokens',
          ],
        },
      ]
    );
  }
}
