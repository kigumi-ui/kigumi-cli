/**
 * Template Tests
 *
 * Tests for src/utils/template.ts - Handlebars rendering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  renderTemplate,
  buildTemplateContext,
  generateComponent,
  generateComponentCSS,
  generateComponentTest,
  generateComponentTestContent,
  clearTemplateCache,
  getTemplatePath,
  updateComponentIndex,
} from '../../src/utils/template.js';
import { getComponent } from '../../src/utils/registry.js';
import type { ComponentDefinition } from '../../src/utils/registry.js';
import type { KigumiConfig } from '../../src/schemas/config.js';

describe('template utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-template-test-'));
    clearTemplateCache();
  });

  afterEach(async () => {
    await fs.remove(testDir);
    clearTemplateCache();
  });

  describe('getTemplatePath', () => {
    it('should construct correct template path', () => {
      const templatePath = getTemplatePath('react', 'Button/Button.tsx.hbs');

      expect(templatePath).toContain('templates');
      expect(templatePath).toContain('react');
      expect(templatePath).toContain('Button');
      expect(templatePath).toMatch(/Button\.tsx\.hbs$/);
    });

    it('should handle different frameworks', () => {
      const reactPath = getTemplatePath('react', 'Button/Button.tsx.hbs');
      const vuePath = getTemplatePath('vue', 'Button/Button.vue.hbs');

      expect(reactPath).toContain('react');
      expect(vuePath).toContain('vue');
    });
  });

  describe('buildTemplateContext', () => {
    it('should build context from component definition', () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const context = buildTemplateContext(button);

      expect(context.name).toBe('Button');
      expect(context.tagName).toBe('wa-button');
      expect(context.description).toBeDefined();
      expect(context.importPath).toBeDefined();
      expect(Array.isArray(context.props)).toBe(true);
    });

    it('should include all required fields', () => {
      const dialog = getComponent('dialog');
      expect(dialog).toBeDefined();

      if (!dialog) return;

      const context = buildTemplateContext(dialog);

      expect(context).toHaveProperty('name');
      expect(context).toHaveProperty('tagName');
      expect(context).toHaveProperty('description');
      expect(context).toHaveProperty('importPath');
      expect(context).toHaveProperty('props');
    });

    it('should preserve props array', () => {
      const button = getComponent('button');
      expect(button).toBeDefined();

      if (!button) return;

      const context = buildTemplateContext(button);

      expect(context.props).toEqual(button.props);
    });
  });

  describe('renderTemplate', () => {
    it('should render simple template', async () => {
      // Create a test template
      const templatePath = path.join(testDir, 'test.hbs');
      await fs.writeFile(templatePath, 'Hello {{name}}!');

      const result = await renderTemplate(templatePath, {
        name: 'Button',
        tagName: 'wa-button',
        description: 'Test',
        importPath: 'test',
        props: [],
      });

      expect(result).toBe('Hello Button!');
    });

    it('should handle undefined values', async () => {
      const templatePath = path.join(testDir, 'test.hbs');
      await fs.writeFile(templatePath, 'Name: {{name}}, Missing: {{missing}}');

      const result = await renderTemplate(templatePath, {
        name: 'Button',
        tagName: 'wa-button',
        description: 'Test',
        importPath: 'test',
        props: [],
      } as unknown as Parameters<typeof renderTemplate>[1]);

      expect(result).toBe('Name: Button, Missing: ');
    });

    it('should cache compiled templates', async () => {
      const templatePath = path.join(testDir, 'test.hbs');
      await fs.writeFile(templatePath, 'Hello {{name}}!');

      const context = {
        name: 'Button',
        tagName: 'wa-button',
        description: 'Test',
        importPath: 'test',
        props: [],
      };

      // First render
      const result1 = await renderTemplate(templatePath, context);

      // Second render (should use cache)
      const result2 = await renderTemplate(templatePath, context);

      expect(result1).toBe(result2);
      expect(result1).toBe('Hello Button!');
    });

    it('should throw error for non-existent template', async () => {
      const templatePath = path.join(testDir, 'nonexistent.hbs');

      await expect(
        renderTemplate(templatePath, {
          name: 'Test',
          tagName: 'wa-test',
          description: 'Test',
          importPath: 'test',
          props: [],
        })
      ).rejects.toThrow();
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

  describe('template cache', () => {
    it('should cache compiled templates', async () => {
      const templatePath = path.join(testDir, 'test.hbs');
      await fs.writeFile(templatePath, 'Test {{name}}');

      const context = {
        name: 'Button',
        tagName: 'wa-button',
        description: 'Test',
        importPath: 'test',
        props: [],
      };

      // First call - compiles and caches
      const result1 = await renderTemplate(templatePath, context);

      // Second call - uses cache (should be faster)
      const result2 = await renderTemplate(templatePath, context);

      expect(result1).toBe(result2);
    });

    it('should clear cache', async () => {
      const templatePath = path.join(testDir, 'test.hbs');
      await fs.writeFile(templatePath, 'Test {{name}}');

      const context = {
        name: 'Button',
        tagName: 'wa-button',
        description: 'Test',
        importPath: 'test',
        props: [],
      };

      await renderTemplate(templatePath, context);

      // Clear cache
      clearTemplateCache();

      // Should still work (recompiles)
      const result = await renderTemplate(templatePath, context);
      expect(result).toBe('Test Button');
    });
  });

  describe('Handlebars helpers', () => {
    it('should quote prop names with hyphens', async () => {
      const templatePath = path.join(testDir, 'test.hbs');
      // Use triple braces to avoid HTML escaping
      await fs.writeFile(
        templatePath,
        '{{#each props}}{{{quoteProp name}}}: {{type}}\n{{/each}}'
      );

      const context = {
        name: 'Test',
        tagName: 'wa-test',
        description: 'Test',
        importPath: 'test',
        props: [
          { name: 'with-caret', type: 'boolean' },
          { name: 'disabled', type: 'boolean' },
        ],
      };

      const result = await renderTemplate(templatePath, context);

      // quoteProp should quote hyphenated names
      expect(result).toMatch(/'with-caret'/);
      expect(result).toContain('disabled:');
      // Regular names should not be quoted
      expect(result).not.toMatch(/'disabled':/);
    });
  });

  describe('error handling', () => {
    it('should handle template syntax errors', async () => {
      const templatePath = path.join(testDir, 'bad.hbs');
      await fs.writeFile(templatePath, 'Hello {{name unclosed');

      await expect(
        renderTemplate(templatePath, {
          name: 'Test',
          tagName: 'wa-test',
          description: 'Test',
          importPath: 'test',
          props: [],
        })
      ).rejects.toThrow();
    });

    it('should handle missing template files', async () => {
      const templatePath = path.join(testDir, 'nonexistent.hbs');

      await expect(
        renderTemplate(templatePath, {
          name: 'Test',
          tagName: 'wa-test',
          description: 'Test',
          importPath: 'test',
          props: [],
        })
      ).rejects.toThrow();
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
