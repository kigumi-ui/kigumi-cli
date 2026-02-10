/**
 * Component Validation Script
 *
 * Parses Web Awesome Agent Skill markdown files and compares component definitions
 * (props, events, methods) against the LOCAL_REGISTRY.
 *
 * Usage: npx tsx scripts/validate-components.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { LOCAL_REGISTRY } from '../src/utils/registry.js';

const SKILLS_PATH =
  'docs/node_modules/@awesome.me/webawesome-pro/dist/skills/webawesome/references/components';

interface SkillProp {
  name: string;
  htmlAttr: string; // kebab-case version
  type: string;
  default?: string;
}

interface SkillEvent {
  name: string; // e.g., 'wa-show'
  description: string;
}

interface SkillMethod {
  name: string;
  description: string;
}

interface SkillData {
  props: SkillProp[];
  events: SkillEvent[];
  methods: SkillMethod[];
}

interface ValidationResult {
  component: string;
  missingProps: SkillProp[];
  missingEvents: SkillEvent[];
  missingMethods: SkillMethod[];
  extraProps: string[]; // Props in registry but not in skill
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Parse the "Attributes & Properties" table from skill markdown
 *
 * Table format varies but typically:
 * | `propertyName` html-attr | `type` Description... | |
 */
function parsePropsTable(markdown: string): SkillProp[] {
  const propsMatch = markdown.match(
    /## Attributes & Properties[\s\S]*?(?=\n## |\n---|\$)/
  );
  if (!propsMatch) return [];

  const props: SkillProp[] = [];
  const tableSection = propsMatch[0];

  // Match table rows: | `propName` attr-name | description | |
  // Pattern: starts with |, has backtick-wrapped name, then attr name
  const rowMatches = tableSection.matchAll(/\|\s*`([^`]+)`\s+([a-z-]+)\s*\|/gi);

  for (const match of rowMatches) {
    const propName = match[1];
    const htmlAttr = match[2];

    // Skip if it looks like a header row
    if (propName === 'Name' || htmlAttr === 'Description') continue;

    props.push({
      name: propName,
      htmlAttr: htmlAttr,
      type: 'string', // Type parsing is complex, simplify for validation
    });
  }

  return props;
}

/**
 * Parse the "Events" table from skill markdown
 *
 * Table format:
 * | `wa-event-name` | Description |
 */
function parseEventsTable(markdown: string): SkillEvent[] {
  const eventsMatch = markdown.match(/## Events[\s\S]*?(?=\n## |\n---|\$)/);
  if (!eventsMatch) return [];

  const events: SkillEvent[] = [];
  const tableSection = eventsMatch[0];

  // Match event rows: | `wa-event-name` | description |
  const rowMatches = tableSection.matchAll(
    /\|\s*`(wa-[a-z-]+)`\s*\|([^|]*)\|/gi
  );

  for (const match of rowMatches) {
    events.push({
      name: match[1],
      description: match[2].trim(),
    });
  }

  return events;
}

/**
 * Parse the "Methods" table from skill markdown
 */
function parseMethodsTable(markdown: string): SkillMethod[] {
  const methodsMatch = markdown.match(/## Methods[\s\S]*?(?=\n## |\n---|\$)/);
  if (!methodsMatch) return [];

  const methods: SkillMethod[] = [];
  const tableSection = methodsMatch[0];

  // Match method rows: | `methodName()` | description |
  const rowMatches = tableSection.matchAll(
    /\|\s*`([a-zA-Z]+)\(\)`\s*\|([^|]*)\|/gi
  );

  for (const match of rowMatches) {
    methods.push({
      name: match[1],
      description: match[2].trim(),
    });
  }

  return methods;
}

async function parseSkillFile(componentKey: string): Promise<SkillData | null> {
  // Handle component key to filename mapping
  // e.g., 'button-group' -> 'button-group.md'
  const skillPath = path.join(SKILLS_PATH, `${componentKey}.md`);

  if (!(await fs.pathExists(skillPath))) {
    return null;
  }

  const markdown = await fs.readFile(skillPath, 'utf-8');

  return {
    props: parsePropsTable(markdown),
    events: parseEventsTable(markdown),
    methods: parseMethodsTable(markdown),
  };
}

async function validateComponent(
  componentKey: string
): Promise<ValidationResult> {
  const component = LOCAL_REGISTRY[componentKey];
  const skill = await parseSkillFile(componentKey);

  if (!skill) {
    return {
      component: componentKey,
      missingProps: [],
      missingEvents: [],
      missingMethods: [],
      extraProps: [],
    };
  }

  // Find missing props (in skill but not in registry)
  const registryPropNames = component.props.map((p) => p.name);
  const registryPropNamesKebab = component.props.map((p) =>
    camelToKebab(p.name)
  );

  const missingProps = skill.props.filter((sp) => {
    // Check both camelCase and kebab-case versions
    const inRegistry =
      registryPropNames.includes(sp.name) ||
      registryPropNames.includes(sp.htmlAttr) ||
      registryPropNamesKebab.includes(sp.htmlAttr);
    return !inRegistry;
  });

  // Find missing events (in skill but not in registry)
  const registryEventNames = (component.events || []).map((e) => e.name);
  const missingEvents = skill.events.filter(
    (se) => !registryEventNames.includes(se.name)
  );

  // Find missing methods
  const registryMethodNames = (component.methods || []).map((m) => m.name);
  const missingMethods = skill.methods.filter(
    (sm) => !registryMethodNames.includes(sm.name)
  );

  // Find extra props (in registry but not in skill)
  const skillPropNames = skill.props.map((p) => p.name);
  const skillPropNamesKebab = skill.props.map((p) => p.htmlAttr);
  const extraProps = registryPropNames.filter((rp) => {
    const rpKebab = camelToKebab(rp);
    return (
      !skillPropNames.includes(rp) && !skillPropNamesKebab.includes(rpKebab)
    );
  });

  return {
    component: componentKey,
    missingProps,
    missingEvents,
    missingMethods,
    extraProps,
  };
}

async function main() {
  console.log('Component Validation Report');
  console.log('===========================\n');

  const results: ValidationResult[] = [];
  const componentKeys = Object.keys(LOCAL_REGISTRY);
  let skillFilesFound = 0;
  let skillFilesMissing = 0;

  for (const componentKey of componentKeys) {
    const skillPath = path.join(SKILLS_PATH, `${componentKey}.md`);
    const skillExists = await fs.pathExists(skillPath);

    if (skillExists) {
      skillFilesFound++;
    } else {
      skillFilesMissing++;
    }

    const result = await validateComponent(componentKey);
    results.push(result);

    const hasIssues =
      result.missingProps.length > 0 ||
      result.missingEvents.length > 0 ||
      result.missingMethods.length > 0;

    if (hasIssues) {
      console.log(`\x1b[33m${result.component}:\x1b[0m`);

      for (const prop of result.missingProps) {
        console.log(
          `  \x1b[31m- Missing prop:\x1b[0m ${prop.name} (${prop.htmlAttr})`
        );
      }
      for (const event of result.missingEvents) {
        console.log(`  \x1b[31m- Missing event:\x1b[0m ${event.name}`);
      }
      for (const method of result.missingMethods) {
        console.log(`  \x1b[31m- Missing method:\x1b[0m ${method.name}()`);
      }
      console.log();
    }
  }

  // Summary
  const withIssues = results.filter(
    (r) =>
      r.missingProps.length > 0 ||
      r.missingEvents.length > 0 ||
      r.missingMethods.length > 0
  );

  const totalMissingProps = results.reduce(
    (sum, r) => sum + r.missingProps.length,
    0
  );
  const totalMissingEvents = results.reduce(
    (sum, r) => sum + r.missingEvents.length,
    0
  );
  const totalMissingMethods = results.reduce(
    (sum, r) => sum + r.missingMethods.length,
    0
  );

  console.log('\n===========================');
  console.log('Summary');
  console.log('===========================');
  console.log(`Total components in registry: ${componentKeys.length}`);
  console.log(`Skill files found: ${skillFilesFound}`);
  console.log(`Skill files missing: ${skillFilesMissing}`);
  console.log(
    `\nComponents with issues: ${withIssues.length}/${results.length}`
  );
  console.log(`Total missing props: ${totalMissingProps}`);
  console.log(`Total missing events: ${totalMissingEvents}`);
  console.log(`Total missing methods: ${totalMissingMethods}`);

  // Output JSON for automated processing
  await fs.writeJSON('validation-results.json', results, { spaces: 2 });
  console.log('\nDetailed results written to validation-results.json');

  // Exit with error code if issues found
  if (withIssues.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
