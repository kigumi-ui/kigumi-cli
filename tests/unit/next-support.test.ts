/**
 * Next.js Support Tests
 *
 * Validates the detection-driven branches added for Next.js App Router:
 * - `generateComponent` prepends `'use client'` when `next` is in deps
 * - `regenerateKigumiSetup` writes kigumi.ts starting with `'use client'`
 * - `generateNextEnvDts` emits JSX types without the `vite/client` reference
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { DEFAULT_CONFIG } from '../../src/schemas/config.js';

describe('next.js support', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-next-support-'))
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  async function writeNextProject(): Promise<void> {
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'test-next',
      version: '1.0.0',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^14.0.0',
      },
    });
  }

  async function writeVitReactProject(): Promise<void> {
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'test-vite',
      version: '1.0.0',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        vite: '^5.0.0',
      },
    });
  }

  describe('generateComponent', () => {
    it("prepends 'use client' in a Next.js project", async () => {
      await writeNextProject();

      const { generateComponent } = await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');

      const button = getComponent('button');
      expect(button).toBeDefined();

      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered.startsWith("'use client';")).toBe(true);
    });

    it("does not prepend 'use client' in a Vite + React project", async () => {
      await writeVitReactProject();

      const { generateComponent } = await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');

      const button = getComponent('button');
      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered.startsWith("'use client';")).toBe(false);
    });

    it("still prepends 'use client' for Pages Router projects", async () => {
      // `isNextProject` treats App and Pages the same way for directive
      // emission. Pages Router doesn't need the directive (no RSC boundary),
      // but Next treats top-level string literals as harmless — emitting it
      // uniformly lets a project migrate from Pages to App without having
      // to regenerate every wrapper first.
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'pages'));
      await fs.writeFile(
        path.join(tempDir, 'pages', '_app.tsx'),
        'export default function App() { return null; }'
      );

      const { generateComponent } = await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');

      const button = getComponent('button');
      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered.startsWith("'use client';")).toBe(true);
    });

    it('strips the per-component CSS import on Pages Router', async () => {
      // Next Pages Router rejects side-effect global CSS imports from any
      // file other than _app.tsx. Pages users must import their stub
      // Button.css manually from _app.tsx if they customize it.
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'pages'));
      await fs.writeFile(
        path.join(tempDir, 'pages', '_app.tsx'),
        'export default function App() { return null; }'
      );

      const { generateComponent } = await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');

      const button = getComponent('button');
      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered).not.toMatch(/import\s+['"]\.\/Button\.css['"]/);
      // The directive survives; only the CSS import is stripped.
      expect(rendered.startsWith("'use client';")).toBe(true);
    });

    it('keeps the per-component CSS import on App Router', async () => {
      // App Router has no Pages-style CSS policy — the component .tsx can
      // import its sibling .css directly.
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'app'));

      const { generateComponent } = await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');

      const button = getComponent('button');
      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered).toContain("import './Button.css';");
    });

    it('emits suppressHydrationWarning on the wa-* host element', async () => {
      // Regression guard: Lit reflects default attributes on upgrade
      // (size="medium", appearance="outlined", etc.), which React's
      // hydration checker flags. suppressHydrationWarning is the
      // documented React API for elements whose attributes mutate
      // post-hydration via a custom element runtime.
      await writeNextProject();

      const { generateComponent } = await import('../../src/utils/template.js');
      const { getComponent } = await import('../../src/utils/registry.js');

      const button = getComponent('button');
      const rendered = await generateComponent(
        button!,
        DEFAULT_CONFIG,
        true,
        tempDir,
        'free'
      );

      expect(rendered).toContain('suppressHydrationWarning');
      // Must appear on the host element, not just as a string in a comment.
      // The host tag in the Button template is <wa-button …>.
      expect(rendered).toMatch(/<wa-button[\s\S]*?suppressHydrationWarning/);
    });
  });

  describe('regenerateKigumiSetup', () => {
    it("writes kigumi.ts starting with 'use client' in Next.js projects", async () => {
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const kigumiTs = await fs.readFile(
        path.join(tempDir, 'src', 'lib', 'kigumi.ts'),
        'utf-8'
      );
      expect(kigumiTs.startsWith("'use client';")).toBe(true);
    });

    it("does not prepend 'use client' in non-Next projects", async () => {
      await writeVitReactProject();
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const kigumiTs = await fs.readFile(
        path.join(tempDir, 'src', 'lib', 'kigumi.ts'),
        'utf-8'
      );
      expect(kigumiTs.startsWith("'use client';")).toBe(false);
    });

    it('omits the layers.css import on Pages Router', async () => {
      // Pages Router rejects transitive global CSS imports via lib/. Users
      // add layers.css directly to _app.tsx per post-install instructions.
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'pages'));
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const kigumiTs = await fs.readFile(
        path.join(tempDir, 'src', 'lib', 'kigumi.ts'),
        'utf-8'
      );
      // The runtime import is gone; only an explanatory comment remains.
      expect(kigumiTs).not.toMatch(/^\s*import\s+['"][^'"]*layers\.css/m);
      expect(kigumiTs).toContain('pages/_app.tsx');
      // The Client Module directive still stays.
      expect(kigumiTs.startsWith("'use client';")).toBe(true);
    });

    it('keeps the layers.css import on App Router', async () => {
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'app'));
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const kigumiTs = await fs.readFile(
        path.join(tempDir, 'src', 'lib', 'kigumi.ts'),
        'utf-8'
      );
      expect(kigumiTs).toContain("import '@/styles/layers.css';");
    });

    it('emits layers.css without layer() qualifiers on Pages Router (F-038)', async () => {
      // Pages Router + Webpack's postcss-import strips the `layer(…)` qualifier
      // on `@import` when it inlines the chain. WA rules then never land in the
      // named `base` layer, so the theme's :root { --wa-* } block never applies.
      // Emit plain `@import` statements on that path; keep the layer declaration.
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'pages'));
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const layersCss = await fs.readFile(
        path.join(tempDir, 'src', 'styles', 'layers.css'),
        'utf-8'
      );
      // Declaration stays so any named-layer authoring the user adds keeps
      // `base < theme` order. WA rules themselves end up unlayered on this
      // path, which outranks named layers via cascade semantics.
      expect(layersCss).toContain('@layer base, theme;');
      // Qualifiers must be absent.
      expect(layersCss).not.toMatch(/layer\(base\)/);
      expect(layersCss).not.toMatch(/layer\(theme\)/);
      // The three @import lines still emit, just unqualified.
      expect(layersCss).toContain(
        "@import '@awesome.me/webawesome/dist/styles/webawesome.css';"
      );
      expect(layersCss).toContain(
        "@import '@awesome.me/webawesome/dist/styles/themes/default.css';"
      );
      expect(layersCss).toContain("@import './theme.css';");
    });

    it('keeps layer() qualifiers on App Router (F-038 regression guard)', async () => {
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'app'));
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const layersCss = await fs.readFile(
        path.join(tempDir, 'src', 'styles', 'layers.css'),
        'utf-8'
      );
      expect(layersCss).toContain('@layer base, theme;');
      expect(layersCss).toContain(
        "@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);"
      );
      expect(layersCss).toContain(
        "@import '@awesome.me/webawesome/dist/styles/themes/default.css' layer(base);"
      );
      expect(layersCss).toContain("@import './theme.css' layer(theme);");
    });

    it('keeps layer() qualifiers in non-Next projects (F-038 scope guard)', async () => {
      // Vite + React is the baseline. The F-038 branch must not leak into
      // non-Next projects.
      await writeVitReactProject();
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const layersCss = await fs.readFile(
        path.join(tempDir, 'src', 'styles', 'layers.css'),
        'utf-8'
      );
      expect(layersCss).toContain(' layer(base)');
      expect(layersCss).toContain(' layer(theme)');
    });

    it("keeps layer() qualifiers when Next router is 'unknown' (F-038 scope guard)", async () => {
      // Next project with neither `app/` nor `pages/` resolves to router
      // 'unknown'. Only `'pages'` should trigger the F-038 plain-import branch;
      // 'unknown' must keep the App-Router-style qualifiers.
      await writeNextProject();
      // Deliberately no `app/` or `pages/` dir.
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'free');

      const layersCss = await fs.readFile(
        path.join(tempDir, 'src', 'styles', 'layers.css'),
        'utf-8'
      );
      expect(layersCss).toContain(' layer(base)');
      expect(layersCss).toContain(' layer(theme)');
    });

    it('strips qualifiers on Pages Router with Pro tier (F-038 tier coverage)', async () => {
      // The end-to-end repro used WA Pro. Confirm the branch fires regardless
      // of which WA package flows through `generateLayersCSS`.
      await writeNextProject();
      await fs.ensureDir(path.join(tempDir, 'pages'));
      await fs.ensureDir(path.join(tempDir, 'src', 'lib'));
      await fs.ensureDir(path.join(tempDir, 'src', 'styles'));

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');

      await regenerateKigumiSetup(tempDir, DEFAULT_CONFIG, 'src/lib', 'pro');

      const layersCss = await fs.readFile(
        path.join(tempDir, 'src', 'styles', 'layers.css'),
        'utf-8'
      );
      expect(layersCss).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css';"
      );
      expect(layersCss).toContain(
        "@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css';"
      );
      expect(layersCss).not.toMatch(/layer\(base\)/);
      expect(layersCss).not.toMatch(/layer\(theme\)/);
    });
  });

  describe('generateNextEnvDts', () => {
    it('emits web-awesome.d.ts without the vite/client reference', async () => {
      await fs.ensureDir(path.join(tempDir, 'src'));

      const { generateNextEnvDts } =
        await import('../../src/utils/regenerate.js');

      await generateNextEnvDts(tempDir, 'src', '@awesome.me/webawesome');

      const dts = await fs.readFile(
        path.join(tempDir, 'src', 'web-awesome.d.ts'),
        'utf-8'
      );

      expect(dts).not.toContain('vite/client');
      expect(dts).toContain('declare global');
      expect(dts).toContain('CustomElements');
      expect(dts).toContain('CustomCssProperties');
    });

    it('writes to the project root when srcDir is empty', async () => {
      const { generateNextEnvDts } =
        await import('../../src/utils/regenerate.js');

      await generateNextEnvDts(tempDir, '', '@awesome.me/webawesome');

      expect(await fs.pathExists(path.join(tempDir, 'web-awesome.d.ts'))).toBe(
        true
      );
    });
  });
});
