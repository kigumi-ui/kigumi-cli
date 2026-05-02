import fs from 'fs-extra';
import path from 'path';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../../src/constants.js';
import type { Tier } from '../../../src/utils/tier.js';

/**
 * Writes a minimal package.json into `dir` so that detectTier() reads it
 * and returns the requested tier. Production code in src/utils/tier.ts
 * checks the dependencies map first; if `@awesome.me/webawesome-pro` is
 * present it returns 'pro', otherwise it falls through to 'free'. Writing
 * a real fixture exercises that path unmocked, replacing the
 * vi.mock('../../src/utils/tier.js') pattern (cluster S, F-126).
 */
export async function writeTierFixture(dir: string, tier: Tier): Promise<void> {
  const pkg = {
    name: 'kigumi-test-fixture',
    version: '0.0.0',
    dependencies: {
      [tier === 'pro' ? WEB_AWESOME_PRO_PACKAGE : WEB_AWESOME_FREE_PACKAGE]:
        '*',
    },
  };
  await fs.writeJson(path.join(dir, 'package.json'), pkg);
}
