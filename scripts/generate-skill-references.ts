#!/usr/bin/env tsx
/**
 * Generate Agent Skill Reference Files
 *
 * This script generates markdown reference files for the transform-webawesome-to-react skill
 * by reading component definitions from the LOCAL_REGISTRY.
 *
 * Generates:
 * - skills/transform-webawesome-to-react/references/components/{component}.md (one per component)
 * - skills/transform-webawesome-to-react/references/transformation-rules.md (overview table)
 * - skills/transform-webawesome-to-react/references/event-mapping.md (event handlers)
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { LOCAL_REGISTRY } from '../src/utils/registry.js';

const SKILLS_DIR = join(
  process.cwd(),
  'skills',
  'transform-webawesome-to-react',
  'references'
);
const COMPONENTS_DIR = join(SKILLS_DIR, 'components');

/**
 * Convert kebab-case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Generate a component reference markdown file
 */
function generateComponentReference(key: string): string {
  const component = LOCAL_REGISTRY[key];
  const webAwesomeTag = component.tagName;
  const kigumiName = component.name;

  // Generate generic description instead of using registry description
  const genericDescription = `React wrapper component for the Web Awesome \`${webAwesomeTag}\` element.`;

  let md = `# ${kigumiName}\n\n`;
  md += `**Web Awesome**: \`${webAwesomeTag}\`  \n`;
  md += `**Kigumi React**: \`<${kigumiName}>\`  \n`;
  md += `**Category**: ${component.category}  \n`;
  md += `**Tier**: ${component.tier}  \n\n`;
  md += `${genericDescription}\n\n`;

  md += `## Transformation Example\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<${webAwesomeTag}`;

  // Add example props
  const exampleProps = component.props.slice(0, 2);
  if (exampleProps.length > 0) {
    exampleProps.forEach((prop) => {
      const value = prop.values
        ? prop.values[0]
        : prop.type === 'boolean'
          ? ''
          : `"${prop.default || 'value'}"`;
      if (prop.type === 'boolean') {
        md += ` ${prop.name}`;
      } else {
        md += ` ${prop.name}=${value}`;
      }
    });
  }

  md += `>Click me</${webAwesomeTag}>\n`;
  md += `\`\`\`\n\n`;

  md += `\`\`\`tsx\n`;
  md += `// Kigumi React\n`;
  md += `import { ${kigumiName} } from '@/components/ui';\n\n`;
  md += `<${kigumiName}`;

  if (exampleProps.length > 0) {
    exampleProps.forEach((prop) => {
      const value = prop.values
        ? `"${prop.values[0]}"`
        : prop.type === 'boolean'
          ? `{true}`
          : `"${prop.default || 'value'}"`;
      md += `\n  ${prop.name}=${value}`;
    });
  }

  md += `\n>\n  Click me\n</${kigumiName}>\n`;
  md += `\`\`\`\n\n`;

  // Props table
  if (component.props.length > 0) {
    md += `## Props\n\n`;
    md += `| Prop | Type | Values | Default | Description |\n`;
    md += `|------|------|--------|---------|-------------|\n`;

    component.props.forEach((prop) => {
      const type = prop.type;
      const values = prop.values
        ? prop.values.map((v) => `'${v}'`).join(' \\| ')
        : '-';
      const defaultVal = prop.default || '-';
      const desc = prop.description || '';
      md += `| \`${prop.name}\` | ${type} | ${values} | \`${defaultVal}\` | ${desc} |\n`;
    });

    md += `\n`;
  }

  // Dependencies
  if (component.dependencies.length > 0) {
    md += `## Dependencies\n\n`;
    md += `This component requires:\n\n`;
    component.dependencies.forEach((dep) => {
      const depComponent = LOCAL_REGISTRY[dep];
      const depName = depComponent ? depComponent.name : toPascalCase(dep);
      md += `- [\`${depName}\`](${dep}.md)\n`;
    });
    md += `\n`;
  }

  md += `## Installation\n\n`;
  md += `\`\`\`bash\n`;
  md += `npx kigumi add ${key}\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;
  md += `**Documentation**: [webawesome.com/docs/components/${key.replace('_', '-')}](https://webawesome.com/docs/components/${key.replace('_', '-')})\n`;

  return md;
}

/**
 * Generate transformation rules overview
 */
function generateTransformationRules(): string {
  let md = `# Transformation Rules\n\n`;
  md += `Complete mapping of Web Awesome components to Kigumi React components.\n\n`;
  md += `## Component Mapping\n\n`;
  md += `| Web Awesome | Kigumi React | Category | Tier | Description |\n`;
  md += `|-------------|--------------|----------|------|-------------|\n`;

  Object.entries(LOCAL_REGISTRY).forEach(([_, component]) => {
    md += `| \`${component.tagName}\` | \`<${component.name}>\` | ${component.category} | ${component.tier} | ${component.description} |\n`;
  });

  md += `\n## Core Transformation Patterns\n\n`;
  md += `### Attributes\n\n`;
  md += `| Web Awesome | React |\n`;
  md += `|-------------|-------|\n`;
  md += `| \`class="..."\` | \`className="..."\` |\n`;
  md += `| \`style="..."\` | \`style={{ ... }}\` |\n`;
  md += `| Kebab-case props | Keep as-is |\n`;
  md += `| \`slot="..."\` | \`slot="..."\` (preserved) |\n`;
  md += `| \`aria-*\` | \`aria-*\` (preserved) |\n`;
  md += `| \`data-*\` | \`data-*\` (preserved) |\n\n`;

  md += `### Self-Closing Tags\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<wa-icon name="star"></wa-icon>\n\n`;
  md += `<!-- React -->\n`;
  md += `<Icon name="star" />\n`;
  md += `\`\`\`\n\n`;

  md += `### Inline Styles\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<wa-button style="max-width: 200px; margin: auto">Button</wa-button>\n\n`;
  md += `<!-- React -->\n`;
  md += `<Button style={{ maxWidth: '200px', margin: 'auto' }}>Button</Button>\n`;
  md += `\`\`\`\n\n`;

  md += `### Slots\n\n`;
  md += `Slots are preserved with the \`slot\` attribute:\n\n`;
  md += `\`\`\`tsx\n`;
  md += `<Card>\n`;
  md += `  <div slot="header">Header Content</div>\n`;
  md += `  Main content\n`;
  md += `  <div slot="footer">Footer Content</div>\n`;
  md += `</Card>\n`;
  md += `\`\`\`\n`;

  return md;
}

/**
 * Generate event mapping reference
 */
function generateEventMapping(): string {
  let md = `# Event Mapping\n\n`;
  md += `Web Awesome components emit custom events prefixed with \`wa-\`. These are mapped to React event handlers.\n\n`;
  md += `## Standard Events\n\n`;
  md += `| Web Awesome Event | React Handler | Type |\n`;
  md += `|-------------------|---------------|------|\n`;
  md += `| \`wa-change\` | \`onChange\` | \`(event: CustomEvent) => void\` |\n`;
  md += `| \`wa-input\` | \`onInput\` | \`(event: CustomEvent) => void\` |\n`;
  md += `| \`wa-show\` | \`onShow\` | \`(event: CustomEvent) => void\` |\n`;
  md += `| \`wa-hide\` | \`onHide\` | \`(event: CustomEvent) => void\` |\n`;
  md += `| \`wa-after-show\` | \`onAfterShow\` | \`(event: CustomEvent) => void\` |\n`;
  md += `| \`wa-after-hide\` | \`onAfterHide\` | \`(event: CustomEvent) => void\` |\n`;
  md += `| \`wa-blur\` | \`onBlur\` | \`(event: FocusEvent) => void\` |\n`;
  md += `| \`wa-focus\` | \`onFocus\` | \`(event: FocusEvent) => void\` |\n`;
  md += `| Standard events | Standard React events | Native types |\n\n`;

  md += `## Example Usage\n\n`;
  md += `\`\`\`tsx\n`;
  md += `import { useState } from 'react';\n`;
  md += `import { Dialog, Button } from '@/components/ui';\n\n`;
  md += `function Example() {\n`;
  md += `  const [open, setOpen] = useState(false);\n\n`;
  md += `  return (\n`;
  md += `    <>\n`;
  md += `      <Button onClick={() => setOpen(true)}>Open Dialog</Button>\n`;
  md += `      <Dialog \n`;
  md += `        open={open}\n`;
  md += `        onHide={() => setOpen(false)}\n`;
  md += `        onAfterShow={(e) => console.log('Dialog shown', e)}\n`;
  md += `      >\n`;
  md += `        Dialog content\n`;
  md += `      </Dialog>\n`;
  md += `    </>\n`;
  md += `  );\n`;
  md += `}\n`;
  md += `\`\`\`\n`;

  return md;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔨 Generating Agent Skill reference files...\n');

  // Create directories
  await mkdir(COMPONENTS_DIR, { recursive: true });

  // Generate component reference files
  let componentCount = 0;
  for (const [key, _component] of Object.entries(LOCAL_REGISTRY)) {
    const content = generateComponentReference(key);
    const filename = `${key}.md`;
    await writeFile(join(COMPONENTS_DIR, filename), content, 'utf-8');
    console.log(`  ✓ Generated references/components/${filename}`);
    componentCount++;
  }

  // Generate transformation rules
  const transformationRules = generateTransformationRules();
  await writeFile(
    join(SKILLS_DIR, 'transformation-rules.md'),
    transformationRules,
    'utf-8'
  );
  console.log(`  ✓ Generated references/transformation-rules.md`);

  // Generate event mapping
  const eventMapping = generateEventMapping();
  await writeFile(join(SKILLS_DIR, 'event-mapping.md'), eventMapping, 'utf-8');
  console.log(`  ✓ Generated references/event-mapping.md`);

  console.log(
    `\n✅ Generated ${componentCount} component references + 2 reference files\n`
  );
}

main().catch(console.error);
