/**
 * Template Tests
 *
 * Tests for src/utils/template.ts — template materialization and component
 * generation. Templates are real framework source files; the only runtime
 * substitution is the tier swap from `@awesome.me/webawesome` to
 * `@awesome.me/webawesome-pro`.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  generateComponent,
  generateComponentCSS,
  getTemplateFileNames,
  getTemplatePath,
  materializeTemplate,
  updateComponentIndex,
} from '../../src/utils/template.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';
import { getComponent } from '../../src/utils/registry.js';
import type { KigumiConfig } from '../../src/schemas/config.js';

describe('template utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-template-test-'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('getTemplatePath', () => {
    it('should construct correct template path', () => {
      const templatePath = getTemplatePath('react', 'Button/Button.tsx');

      expect(templatePath).toContain('templates');
      expect(templatePath).toContain('react');
      expect(templatePath).toContain('Button');
      expect(templatePath).toMatch(/Button\.tsx$/);
    });

    it('should handle different frameworks', () => {
      const reactPath = getTemplatePath('react', 'Button/Button.tsx');
      const vuePath = getTemplatePath('vue', 'Button/Button.vue');

      expect(reactPath).toContain('react');
      expect(vuePath).toContain('vue');
    });
  });

  describe('materializeTemplate', () => {
    async function writeTemplate(
      contents: string,
      filename = 'fixture.tsx'
    ): Promise<string> {
      const filePath = path.join(testDir, filename);
      await fs.writeFile(filePath, contents);
      return filePath;
    }

    it('returns content verbatim on the Free tier', async () => {
      const source = [
        "import { Button } from '@awesome.me/webawesome/dist/components/button/button.js';",
        '',
        'export { Button };',
        '',
      ].join('\n');
      const templatePath = await writeTemplate(source);

      const result = await materializeTemplate(
        templatePath,
        WEB_AWESOME_FREE_PACKAGE
      );

      expect(result).toBe(source);
    });

    it('rewrites a single import to the Pro package on Pro tier', async () => {
      const source =
        "import { Button } from '@awesome.me/webawesome/dist/components/button/button.js';\n";
      const templatePath = await writeTemplate(source);

      const result = await materializeTemplate(
        templatePath,
        WEB_AWESOME_PRO_PACKAGE
      );

      expect(result).toBe(
        "import { Button } from '@awesome.me/webawesome-pro/dist/components/button/button.js';\n"
      );
      expect(result).not.toMatch(/@awesome\.me\/webawesome\/dist/);
    });

    it('rewrites both occurrences of the Angular two-import pattern in one pass', async () => {
      // Angular .component.ts files contain one `import type` and one dynamic
      // `import()` of the same package — the global flag must hit both.
      const source = [
        "import type { Button } from '@awesome.me/webawesome/dist/components/button/button.js';",
        '',
        "void import('@awesome.me/webawesome/dist/components/button/button.js');",
        '',
      ].join('\n');
      const templatePath = await writeTemplate(source, 'angular.component.ts');

      const result = await materializeTemplate(
        templatePath,
        WEB_AWESOME_PRO_PACKAGE
      );

      const matches = result.match(/@awesome\.me\/webawesome-pro/g) ?? [];
      expect(matches).toHaveLength(2);
      expect(result).not.toMatch(/@awesome\.me\/webawesome\/dist/);
    });

    it('is idempotent when re-materialized against an already-Pro source', async () => {
      // Guards the negative-lookahead semantics: running the rewrite twice
      // must not produce `@awesome.me/webawesome-pro-pro`.
      const source =
        "import { Button } from '@awesome.me/webawesome/dist/components/button/button.js';\n";
      const templatePath = await writeTemplate(source);

      const firstPass = await materializeTemplate(
        templatePath,
        WEB_AWESOME_PRO_PACKAGE
      );

      const secondPassPath = path.join(testDir, 'second-pass.tsx');
      await fs.writeFile(secondPassPath, firstPass);
      const secondPass = await materializeTemplate(
        secondPassPath,
        WEB_AWESOME_PRO_PACKAGE
      );

      expect(secondPass).toBe(firstPass);
      expect(secondPass).not.toContain('webawesome-pro-pro');
    });
  });

  describe('generateComponent', () => {
    it('should generate React TypeScript component', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(
        button,
        config,
        true,
        testDir,
        'free'
      );

      expect(component).toBeDefined();
      expect(component.length).toBeGreaterThan(0);
    });

    it('should generate React JavaScript component', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: false,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(
        button,
        config,
        false,
        testDir,
        'free'
      );

      expect(component).toBeDefined();
      expect(component.length).toBeGreaterThan(0);
    });

    it('should generate Vue component', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'vue',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(
        button,
        config,
        true,
        testDir,
        'free'
      );

      expect(component).toBeDefined();
      expect(component.length).toBeGreaterThan(0);
    });

    it('writes no registry default into Vue JS Options API output (issue #152)', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();
      if (!button) return;

      const config: KigumiConfig = {
        framework: 'vue',
        typescript: false,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(
        button,
        config,
        false,
        testDir,
        'free'
      );

      // The props are declared (the premise), but carry no default: the
      // Template forwards any value that is set, so a default would land on
      // the host where every other variant leaves the element's own.
      expect(component).toContain(
        'appearance: { type: String, required: false }'
      );
      expect(component).toContain('size: { type: String, required: false }');
      expect(component).toContain(
        'disabled: { type: Boolean, required: false }'
      );
      expect(component).not.toMatch(/\bdefault:/);
    });

    it('rewrites the import path to the Pro package on Pro tier', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();
      if (!button) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const free = await generateComponent(
        button,
        config,
        true,
        testDir,
        'free'
      );
      const pro = await generateComponent(button, config, true, testDir, 'pro');

      expect(free).toContain('@awesome.me/webawesome/dist/components/button/');
      expect(free).not.toContain('@awesome.me/webawesome-pro/');

      expect(pro).toContain(
        '@awesome.me/webawesome-pro/dist/components/button/'
      );
      expect(pro).not.toMatch(/@awesome\.me\/webawesome\/dist/);
    });

    it.each(['react', 'vue', 'angular'] as const)(
      'rewrites the dist/events type imports to the Pro package (%s)',
      async (framework) => {
        // Handler types import Web Awesome's event classes from dist/events
        // (docs/adr/0005); a Pro project must get them from the Pro package.
        const dialog = getComponent('dialog');
        expect(dialog).toBeDefined();
        if (!dialog) return;

        const config: KigumiConfig = {
          framework,
          typescript: true,
          componentsDir: 'src/components',
          utilsDir: 'src/lib',
          stylesDir: 'src/styles',
          theme: {
            selected: 'awesome',
            palette: 'sky',
            brandColor: '#0ea5e9',
          },
        };

        const free = await generateComponent(
          dialog,
          config,
          true,
          testDir,
          'free'
        );
        const pro = await generateComponent(
          dialog,
          config,
          true,
          testDir,
          'pro'
        );

        // Premise: the committed Template really imports an event class.
        expect(free).toContain(
          "import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';"
        );
        expect(pro).toContain(
          "import type { WaHideEvent } from '@awesome.me/webawesome-pro/dist/events/hide.js';"
        );
        expect(pro).not.toMatch(/@awesome\.me\/webawesome\/dist\/events/);
      }
    );
  });

  describe('generateComponentCSS', () => {
    it('should generate CSS file', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await generateComponentCSS(button, config, testDir);

      const cssPath = path.join(testDir, 'src/components/Button/Button.css');
      expect(await fs.pathExists(cssPath)).toBe(true);
    });

    it('should create component directory if missing', async () => {
      const dialog = getComponent('dialog');
      expect(dialog).toBeDefined();

      if (!dialog) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await generateComponentCSS(dialog, config, testDir);

      const componentDir = path.join(testDir, 'src/components/Dialog');
      expect(await fs.pathExists(componentDir)).toBe(true);
    });

    it('should generate CSS for all frameworks', async () => {
      const input = getComponent('input');
      expect(input).toBeDefined();

      if (!input) return;

      const frameworks = ['react', 'vue'] as const;

      for (const framework of frameworks) {
        const config: KigumiConfig = {
          framework,
          typescript: true,
          componentsDir: 'src/components',
          utilsDir: 'src/lib',
          stylesDir: 'src/styles',
          theme: {
            selected: 'awesome',
            palette: 'sky',
            brandColor: '#0ea5e9',
          },
        };

        const frameworkDir = path.join(testDir, framework);
        await generateComponentCSS(input, config, frameworkDir);

        const cssPath = path.join(
          frameworkDir,
          'src/components/Input/Input.css'
        );
        expect(await fs.pathExists(cssPath)).toBe(true);
      }
    });
  });

  // The files a committed Template directory holds, and so the only files
  // `kigumi add` can copy: no per-Template test (issue #80).
  describe('getTemplateFileNames', () => {
    it.each([
      ['react', ['ButtonGroup.tsx', 'ButtonGroup.jsx', 'ButtonGroup.css']],
      ['vue', ['ButtonGroup.vue', 'ButtonGroup.js.vue', 'ButtonGroup.css']],
      ['angular', ['button-group.component.ts', 'button-group.component.css']],
    ] as const)(
      'names the %s files of a multi-word component',
      (framework, files) => {
        expect(getTemplateFileNames(framework, 'ButtonGroup')).toEqual(files);
      }
    );
  });

  describe('framework-specific generation', () => {
    it('should generate different output for React vs Vue', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const reactConfig: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const vueConfig: KigumiConfig = {
        framework: 'vue',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const reactComponent = await generateComponent(
        button,
        reactConfig,
        true,
        testDir,
        'free'
      );
      const vueComponent = await generateComponent(
        button,
        vueConfig,
        true,
        testDir,
        'free'
      );

      // React and Vue should generate different code
      expect(reactComponent).not.toBe(vueComponent);
    });

    it('should generate different output for TypeScript vs JavaScript', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const tsComponent = await generateComponent(
        button,
        config,
        true,
        testDir,
        'free'
      );
      const jsComponent = await generateComponent(
        button,
        config,
        false,
        testDir,
        'free'
      );

      // TypeScript and JavaScript should generate different code
      expect(tsComponent).not.toBe(jsComponent);
    });
  });

  describe('updateComponentIndex', () => {
    const reactConfig: KigumiConfig = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: {
        selected: 'awesome',
        palette: 'sky',
        brandColor: '#0ea5e9',
      },
    };

    it('sorts exports alphabetically when adding a new component', async () => {
      const componentsDir = path.join(testDir, reactConfig.componentsDir);
      await fs.ensureDir(componentsDir);
      await fs.writeFile(
        path.join(componentsDir, 'index.ts'),
        "export * from './TabGroup/TabGroup';\nexport * from './Button/Button';\n"
      );

      const input = getComponent('input');
      expect(input).toBeDefined();
      if (!input) return;

      await updateComponentIndex(input, reactConfig, testDir);

      const result = await fs.readFile(
        path.join(componentsDir, 'index.ts'),
        'utf-8'
      );
      expect(result).toBe(
        "export * from './Button/Button';\n" +
          "export * from './Input/Input';\n" +
          "export * from './TabGroup/TabGroup';\n"
      );
    });

    it('is idempotent when component already exported', async () => {
      const componentsDir = path.join(testDir, reactConfig.componentsDir);
      await fs.ensureDir(componentsDir);
      const initial =
        "export * from './Button/Button';\n" +
        "export * from './Input/Input';\n";
      await fs.writeFile(path.join(componentsDir, 'index.ts'), initial);

      const button = getComponent('button');
      expect(button).toBeDefined();
      if (!button) return;

      await updateComponentIndex(button, reactConfig, testDir);

      const result = await fs.readFile(
        path.join(componentsDir, 'index.ts'),
        'utf-8'
      );
      expect(result).toBe(initial);
    });

    it('creates a new index file when none exists', async () => {
      const componentsDir = path.join(testDir, reactConfig.componentsDir);
      await fs.ensureDir(componentsDir);

      const dialog = getComponent('dialog');
      expect(dialog).toBeDefined();
      if (!dialog) return;

      await updateComponentIndex(dialog, reactConfig, testDir);

      const result = await fs.readFile(
        path.join(componentsDir, 'index.ts'),
        'utf-8'
      );
      expect(result).toBe("export * from './Dialog/Dialog';\n");
    });

    it('sorts Vue default exports alphabetically', async () => {
      const vueConfig: KigumiConfig = { ...reactConfig, framework: 'vue' };
      const componentsDir = path.join(testDir, vueConfig.componentsDir);
      await fs.ensureDir(componentsDir);
      await fs.writeFile(
        path.join(componentsDir, 'index.ts'),
        "export { default as TabGroup } from './TabGroup/TabGroup.vue';\n" +
          "export { default as Button } from './Button/Button.vue';\n"
      );

      const input = getComponent('input');
      expect(input).toBeDefined();
      if (!input) return;

      await updateComponentIndex(input, vueConfig, testDir);

      const result = await fs.readFile(
        path.join(componentsDir, 'index.ts'),
        'utf-8'
      );
      expect(result).toBe(
        "export { default as Button } from './Button/Button.vue';\n" +
          "export { default as Input } from './Input/Input.vue';\n" +
          "export { default as TabGroup } from './TabGroup/TabGroup.vue';\n"
      );
    });

    it('sorts Angular component exports alphabetically', async () => {
      const angularConfig: KigumiConfig = {
        ...reactConfig,
        framework: 'angular',
      };
      const componentsDir = path.join(testDir, angularConfig.componentsDir);
      await fs.ensureDir(componentsDir);
      await fs.writeFile(
        path.join(componentsDir, 'index.ts'),
        "export { TabGroupComponent } from './TabGroup/tab-group.component';\n" +
          "export { ButtonComponent } from './Button/button.component';\n"
      );

      const input = getComponent('input');
      expect(input).toBeDefined();
      if (!input) return;

      await updateComponentIndex(input, angularConfig, testDir);

      const result = await fs.readFile(
        path.join(componentsDir, 'index.ts'),
        'utf-8'
      );
      expect(result).toBe(
        "export { ButtonComponent } from './Button/button.component';\n" +
          "export { InputComponent } from './Input/input.component';\n" +
          "export { TabGroupComponent } from './TabGroup/tab-group.component';\n"
      );
    });
  });
});
