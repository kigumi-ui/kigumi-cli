/**
 * Template Tests
 *
 * Tests for src/utils/template.ts — template materialization and component
 * generation. Templates are real framework source files; the only runtime
 * substitution is the tier swap from `@awesome.me/webawesome` to
 * `@awesome.me/webawesome-pro`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  generateComponent,
  generateComponentCSS,
  generateComponentTest,
  generateComponentTestContent,
  getTemplatePath,
  materializeTemplate,
  updateComponentIndex,
} from '../../src/utils/template.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';
import { getComponent } from '../../src/utils/registry.js';
import type { ComponentDefinition } from '../../src/utils/registry.js';
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
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(button, config, true);

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
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(button, config, false);

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
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(button, config, true);

      expect(component).toBeDefined();
      expect(component.length).toBeGreaterThan(0);
    });

    it('quotes string prop defaults in Vue JS Options API output', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();
      if (!button) return;

      const config: KigumiConfig = {
        framework: 'vue',
        typescript: false,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const component = await generateComponent(button, config, false);

      // String defaults must be quoted — otherwise they emit as bare identifiers
      // and crash at module load ("neutral is not defined").
      expect(component).toContain("default: 'neutral'");
      expect(component).toContain("default: 'filled'");
      expect(component).toContain("default: 'medium'");

      // Boolean defaults must stay unquoted.
      expect(component).toContain('default: false');
      expect(component).not.toContain("default: 'false'");

      // No bare-identifier form should survive for the known string enums.
      expect(component).not.toMatch(/default:\s+neutral\b/);
      expect(component).not.toMatch(/default:\s+filled\b/);
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
        aliases: {},
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
        aliases: {},
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
        aliases: {},
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
          aliases: {},
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

  describe('generateComponentTest', () => {
    it('should generate React test file', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await generateComponentTest(button, config, testDir);

      const testPath = path.join(
        testDir,
        'src/components/Button/Button.test.tsx'
      );
      expect(await fs.pathExists(testPath)).toBe(true);

      const content = await fs.readFile(testPath, 'utf-8');
      expect(content).toContain('describe');
      expect(content).toContain('Button');
    });

    it('should generate Vue test file', async () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const config: KigumiConfig = {
        framework: 'vue',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await generateComponentTest(button, config, testDir);

      const testPath = path.join(
        testDir,
        'src/components/Button/Button.test.ts'
      );
      expect(await fs.pathExists(testPath)).toBe(true);

      const content = await fs.readFile(testPath, 'utf-8');
      expect(content).toContain('describe');
      expect(content).toContain('Button');
    });

    it('should handle TypeScript vs JavaScript', async () => {
      const input = getComponent('input');
      expect(input).toBeDefined();

      if (!input) return;

      // TypeScript test
      const tsConfig: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await generateComponentTest(input, tsConfig, path.join(testDir, 'ts'));

      const tsTestPath = path.join(
        testDir,
        'ts/src/components/Input/Input.test.tsx'
      );
      expect(await fs.pathExists(tsTestPath)).toBe(true);

      // JavaScript test
      const jsConfig: KigumiConfig = {
        framework: 'react',
        typescript: false,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      await generateComponentTest(input, jsConfig, path.join(testDir, 'js'));

      const jsTestPath = path.join(
        testDir,
        'js/src/components/Input/Input.test.jsx'
      );
      expect(await fs.pathExists(jsTestPath)).toBe(true);
    });
  });

  describe('generateComponentTestContent - Angular kebab-case template lookup', () => {
    // Regression guard against a bug where the Angular test-template lookup
    // used PascalCase filenames (ButtonGroup.component.spec.ts) while the
    // actual template files use kebab-case (button-group.component.spec.ts).
    // On case-insensitive macOS the lookup coincidentally succeeded; on
    // case-sensitive Linux CI it fell through to the inline fallback generator,
    // producing different output per OS.
    it('probes the kebab-case filename for multi-word Angular components', async () => {
      const buttonGroup = getComponent('button-group');
      expect(buttonGroup).not.toBeNull();

      const angularConfig: KigumiConfig = {
        framework: 'angular',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const pathExistsSpy = vi.spyOn(fs, 'pathExists');
      try {
        await generateComponentTestContent(
          buttonGroup as ComponentDefinition,
          angularConfig
        );

        const checkedPaths = pathExistsSpy.mock.calls.map(
          (call) => call[0] as string
        );
        const testTemplatePaths = checkedPaths.filter((p) =>
          p.endsWith('.component.spec.ts')
        );

        expect(testTemplatePaths.length).toBeGreaterThan(0);
        expect(testTemplatePaths.every((p) => p.includes('button-group'))).toBe(
          true
        );
        expect(
          testTemplatePaths.some((p) => /ButtonGroup\.component\.spec/.test(p))
        ).toBe(false);
      } finally {
        pathExistsSpy.mockRestore();
      }
    });

    it('keeps non-Angular frameworks on the PascalCase filename', async () => {
      const buttonGroup = getComponent('button-group');
      expect(buttonGroup).not.toBeNull();

      const reactConfig: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const pathExistsSpy = vi.spyOn(fs, 'pathExists');
      try {
        await generateComponentTestContent(
          buttonGroup as ComponentDefinition,
          reactConfig
        );

        const checkedPaths = pathExistsSpy.mock.calls.map(
          (call) => call[0] as string
        );
        const testTemplatePaths = checkedPaths.filter(
          (p) => p.endsWith('.test.tsx') || p.endsWith('.test.ts')
        );

        expect(testTemplatePaths.length).toBeGreaterThan(0);
        expect(
          testTemplatePaths.every((p) => p.includes('ButtonGroup.test'))
        ).toBe(true);
      } finally {
        pathExistsSpy.mockRestore();
      }
    });
  });

  describe('generateComponentTestContent - React fallback', () => {
    it('queries the wa-* element by tag name and asserts className', async () => {
      const fake: ComponentDefinition = {
        name: 'NonexistentComponent',
        tagName: 'wa-nonexistent',
        category: 'test',
        description: 'synthetic fixture for fallback test',
        dependencies: [],
        files: { react: [] },
        props: [],
        importPath:
          '@awesome.me/webawesome/dist/components/nonexistent/nonexistent.js',
        tier: 'free',
      };

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const content = await generateComponentTestContent(fake, config);

      expect(content).toContain("container.querySelector('wa-nonexistent')");
      expect(content).not.toContain("container.querySelector('.custom-class')");
      expect(content).toMatch(/\.className.*toContain\(['"]custom-class['"]\)/);
    });
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
        aliases: {},
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
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const reactComponent = await generateComponent(button, reactConfig);
      const vueComponent = await generateComponent(button, vueConfig);

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
        aliases: {},
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const tsComponent = await generateComponent(button, config, true);
      const jsComponent = await generateComponent(button, config, false);

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
      aliases: {},
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
