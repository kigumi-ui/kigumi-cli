/**
 * Surgical layers.css Rewrite Tests
 *
 * Verifies that `surgicalRewriteLayersCss`:
 * - Rewrites only the Web Awesome @import lines for both base and theme CSS
 * - Preserves user customizations (custom layers, comments, theme.css import)
 * - Handles free->pro, pro->free, and is idempotent
 * - Throws LayersCssRewriteError when the expected pattern is missing
 * - Leaves community theme imports alone
 * - Handles hyphenated theme names
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { surgicalRewriteLayersCss } from '../../src/utils/regenerate.js';
import { LayersCssRewriteError } from '../../src/errors/layers-css.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';

const FREE_DEFAULT_LAYERS = `/**
 * Web Awesome CSS Cascade Layers
 */

/* Define layer order */
@layer base, theme;

/* Layer 1: Web Awesome base styles */
@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);

/* Layer 1: Web Awesome theme styles */
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);

/* Layer 2: Your custom CSS overrides */
@import '@/styles/theme.css' layer(theme);
`;

const PRO_DEFAULT_LAYERS = `/**
 * Web Awesome CSS Cascade Layers
 */

/* Define layer order */
@layer base, theme;

/* Layer 1: Web Awesome base styles */
@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base);

/* Layer 1: Web Awesome theme styles */
@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);

/* Layer 2: Your custom CSS overrides */
@import '@/styles/theme.css' layer(theme);
`;

describe('surgicalRewriteLayersCss', () => {
  let tmpDir: string;
  let filePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-layers-test-'));
    filePath = path.join(tmpDir, 'layers.css');
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('rewrites free -> pro for the default layers.css', async () => {
    await fs.writeFile(filePath, FREE_DEFAULT_LAYERS);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css' layer(base)`
    );
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/themes/default.css' layer(base)`
    );
    expect(content).not.toContain(
      `@import '${WEB_AWESOME_FREE_PACKAGE}/dist/styles/`
    );
  });

  it('rewrites pro -> free for the default layers.css', async () => {
    await fs.writeFile(filePath, PRO_DEFAULT_LAYERS);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_FREE_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_FREE_PACKAGE}/dist/styles/webawesome.css' layer(base)`
    );
    expect(content).toContain(
      `@import '${WEB_AWESOME_FREE_PACKAGE}/dist/styles/themes/default.css' layer(base)`
    );
    expect(content).not.toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/`
    );
  });

  it('is idempotent: running twice returns changed:false the second time', async () => {
    await fs.writeFile(filePath, FREE_DEFAULT_LAYERS);

    const first = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );
    const second = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
  });

  it('preserves a custom @layer declaration above the WA imports', async () => {
    const input = `@layer reset, custom, base, theme;

@import '@/styles/reset.css' layer(reset);
@import '@/styles/custom-tokens.css' layer(custom);

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;
    await fs.writeFile(filePath, input);

    await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('@layer reset, custom, base, theme;');
    expect(content).toContain("@import '@/styles/reset.css' layer(reset);");
    expect(content).toContain(
      "@import '@/styles/custom-tokens.css' layer(custom);"
    );
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css' layer(base)`
    );
  });

  it('preserves user comments', async () => {
    const input = `/* My custom layers setup */
/* Do not touch this file without also updating foo.css */

@layer base, theme;

/* CRITICAL: keep this import first */
@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;
    await fs.writeFile(filePath, input);

    await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('/* My custom layers setup */');
    expect(content).toContain(
      '/* Do not touch this file without also updating foo.css */'
    );
    expect(content).toContain('/* CRITICAL: keep this import first */');
  });

  it('preserves the user theme.css import untouched', async () => {
    await fs.writeFile(filePath, FREE_DEFAULT_LAYERS);

    await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain("@import '@/styles/theme.css' layer(theme);");
  });

  it('throws LayersCssRewriteError when the expected @import pattern is missing', async () => {
    const noImports = `@layer base, theme;

/* User removed the Web Awesome imports and is loading them via JS */

@import '@/styles/theme.css' layer(theme);
`;
    await fs.writeFile(filePath, noImports);

    await expect(
      surgicalRewriteLayersCss(filePath, WEB_AWESOME_PRO_PACKAGE, 'default')
    ).rejects.toBeInstanceOf(LayersCssRewriteError);
  });

  it('does not touch community theme imports', async () => {
    // Community themes live under the user's own stylesDir, not in a WA
    // package. The base Web Awesome import still needs to be migrated,
    // but the community theme import must remain untouched.
    const input = `@layer base, theme;

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@/styles/community-themes/sunset.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;
    await fs.writeFile(filePath, input);

    await surgicalRewriteLayersCss(filePath, WEB_AWESOME_PRO_PACKAGE, 'sunset');

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css' layer(base)`
    );
    expect(content).toContain(
      "@import '@/styles/community-themes/sunset.css' layer(base);"
    );
  });

  it('returns changed:false when file already has the target package', async () => {
    // Distinct from the idempotency test: file starts correct on the first call
    await fs.writeFile(filePath, PRO_DEFAULT_LAYERS);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(false);
    // File content unchanged
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe(PRO_DEFAULT_LAYERS);
  });

  it('rewrites file with only the base import (no theme import)', async () => {
    const input = `@layer base;

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
`;
    await fs.writeFile(filePath, input);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css' layer(base)`
    );
  });

  it('rewrites file with only the theme import (no base import)', async () => {
    const input = `@layer base;

@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);
`;
    await fs.writeFile(filePath, input);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/themes/default.css' layer(base)`
    );
  });

  it('rewrites double-quoted @import syntax', async () => {
    const input = `@layer base, theme;

@import "@awesome.me/webawesome/dist/styles/webawesome.css" layer(base);
@import "@awesome.me/webawesome/dist/styles/themes/default.css" layer(base);

@import '@/styles/theme.css' layer(theme);
`;
    await fs.writeFile(filePath, input);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css`
    );
    // The free package (@awesome.me/webawesome) is a substring of the pro
    // package, so check for the specific free-only import path instead.
    expect(content).not.toContain(
      `${WEB_AWESOME_FREE_PACKAGE}/dist/styles/webawesome.css"`
    );
    expect(content).not.toContain(
      `${WEB_AWESOME_FREE_PACKAGE}/dist/styles/themes/`
    );
  });

  it('replaces multiple occurrences of the base import', async () => {
    // Unusual but possible: the code comment in regenerate.ts explicitly
    // mentions constructing a global regex for this case
    const input = `@layer base, theme;

@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);

@import '@/styles/theme.css' layer(theme);
`;
    await fs.writeFile(filePath, input);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    // Both base occurrences must be replaced
    const matches = content.match(
      new RegExp(`${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome\\.css`, 'g')
    );
    expect(matches).toHaveLength(2);
    expect(content).not.toContain(
      `${WEB_AWESOME_FREE_PACKAGE}/dist/styles/webawesome.css`
    );
  });

  it('round-trips a Pages-Router-flavored layers.css (F-038 regression guard)', async () => {
    // Pages Router emits layers.css without `layer(…)` qualifiers to work
    // around Webpack's postcss-import dropping the qualifier (see F-038).
    // Tier migration must still rewrite the @import lines so free↔pro swaps
    // continue to work for Pages Router consumers.
    const pagesFlavor = `/**
 * Web Awesome CSS Cascade Layers
 */

@layer base, theme;

@import '@awesome.me/webawesome/dist/styles/webawesome.css';
@import '@awesome.me/webawesome/dist/styles/themes/default.css';
@import './theme.css';
`;
    await fs.writeFile(filePath, pagesFlavor);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'default'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/webawesome.css';`
    );
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/themes/default.css';`
    );
    expect(content).not.toContain(
      `@import '${WEB_AWESOME_FREE_PACKAGE}/dist/styles/`
    );
    // Layer declaration + theme.css import survive verbatim.
    expect(content).toContain('@layer base, theme;');
    expect(content).toContain("@import './theme.css';");
    // No stray `layer(…)` got introduced by the rewrite.
    expect(content).not.toMatch(/layer\(base\)/);
    expect(content).not.toMatch(/layer\(theme\)/);
  });

  it('handles hyphenated theme names', async () => {
    const input = FREE_DEFAULT_LAYERS.replace(
      'themes/default.css',
      'themes/my-custom-theme.css'
    );
    await fs.writeFile(filePath, input);

    const result = await surgicalRewriteLayersCss(
      filePath,
      WEB_AWESOME_PRO_PACKAGE,
      'my-custom-theme'
    );

    expect(result.changed).toBe(true);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain(
      `@import '${WEB_AWESOME_PRO_PACKAGE}/dist/styles/themes/my-custom-theme.css' layer(base)`
    );
  });
});
