# Cursor Skills

> Automated workflows for Kigumi CLI development

## Available Skills

| Skill                           | Location                                                                               | Purpose                                     |
| ------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Generate Web Awesome Component  | [skills/generate-webawesome-component/](skills/generate-webawesome-component/SKILL.md) | Create React wrappers from Web Awesome docs |
| Transform Web Awesome to Kigumi | [skills/transform-wa-to-kigumi/](skills/transform-wa-to-kigumi/SKILL.md)               | Convert Web Awesome HTML to Kigumi UI React |

---

## Generate Web Awesome Component

**Trigger phrases:**

- "Generate React wrapper for {component} from Web Awesome docs"
- "Add {component} component from webawesome.com"
- "Create templates for wa-{component}"

**What it does:**

1. Fetches Web Awesome documentation
2. Extracts metadata (props, events, methods, slots)
3. Detects complexity (simple vs complex pattern)
4. Updates `src/utils/registry.ts`
5. Generates all template files (.tsx, .jsx, tests, css)
6. Validates against AGENTS.md patterns

**Complexity Detection:**

- **Simple**: No custom events/methods (Button, Badge, Icon)
- **Complex**: Has wa-\* events or imperative methods (Dialog, Drawer, Popover)

**Example:**

```
User: "Generate React wrapper for Button Group from Web Awesome docs"
→ Skill fetches https://webawesome.com/docs/components/button-group
→ Creates templates/react/ButtonGroup/
→ Updates src/utils/registry.ts
```

**Full documentation:** [skills/generate-webawesome-component/SKILL.md](skills/generate-webawesome-component/SKILL.md)

---

## Transform Web Awesome to Kigumi

**Trigger phrases:**

- "Transform this Web Awesome code to Kigumi"
- "Convert this wa- code to Kigumi UI"
- "Make this Web Awesome snippet work with Kigumi"
- User pastes HTML with `<wa-*>` tags and asks for conversion

**What it does:**

1. Reads `kigumi.config.json` for framework, TypeScript, and alias settings
2. Parses Web Awesome HTML code snippet
3. Maps `<wa-*>` tags to Kigumi React components (PascalCase)
4. Transforms attributes (`class` → `className`, inline styles to objects)
5. Preserves slots, ARIA attributes, and Web Awesome utility classes
6. Generates proper imports based on config
7. Outputs complete, runnable React component code

**Transformation Examples:**

- `<wa-button>` → `<Button>`
- `<wa-card>` → `<Card>`
- `<wa-icon name="star">` → `<Icon name="star" />`
- `class="wa-heading-m"` → `className="wa-heading-m"`
- `style="margin: auto"` → `style={{ margin: 'auto' }}`

**Example:**

```
User: "Convert this Web Awesome code to Kigumi"
[pastes HTML with <wa-card>, <wa-button>, etc.]

→ Skill reads kigumi.config.json
→ Maps all wa-* components to Kigumi components
→ Generates import { Button, Card, ... } from '@/components/ui'
→ Outputs complete React component with proper syntax
```

**Full documentation:** [skills/transform-wa-to-kigumi/SKILL.md](skills/transform-wa-to-kigumi/SKILL.md)

---

## Adding New Skills

1. Create directory: `.cursor/skills/{skill-name}/`
2. Create `SKILL.md` with:
   - YAML frontmatter (name, description)
   - Trigger conditions
   - Step-by-step workflow
   - Output format
3. Update this index

---

**Parent:** [AGENTS.md](../AGENTS.md)
