# Cursor Skills

> Automated workflows for Kigumi CLI development

## Available Skills

| Skill                           | Location                                                                               | Purpose                                     |
| ------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Generate Web Awesome Component  | [skills/generate-webawesome-component/](skills/generate-webawesome-component/SKILL.md) | Create React wrappers from Web Awesome docs |
| Transform Web Awesome to Kigumi | [skills/transform-wa-to-kigumi/](skills/transform-wa-to-kigumi/SKILL.md)               | Convert Web Awesome HTML to Kigumi UI React |
| Generate Kigumi Theme Preset    | [skills/generate-kigumi-theme-preset/](skills/generate-kigumi-theme-preset/SKILL.md)   | Create theme presets for Kigumi Studio      |

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

## Generate Kigumi Theme Preset

**Trigger phrases:**

- "Create a {description} theme preset for Kigumi Studio"
- "Generate a new theme with {colors/mood}"
- "Modify the {preset-name} preset"
- "Make the ocean breeze theme warmer"
- "Validate my theme preset"
- "What design tokens are available?"

**What it does:**

1. Understands requirements (natural language mood/style OR reference preset + changes)
2. Develops comprehensive color palette (brand → surface → text → semantic)
3. Chooses typography from 26 Bunny Fonts
4. Configures spacing, borders, shadows, transitions
5. Derives dark mode variant with proper contrast
6. Generates JSON preset file in `docs/src/kigumi-studio/themes/` (+ optional companion CSS)
7. Validates via `preset-schema.test.ts` + WCAG contrast ratios
8. Provides preview instructions

**Token Coverage:**

- **43 Studio Tokens**: All editable properties in Kigumi Studio UI
- **Extended WA Tokens**: Additional Web Awesome tokens (via companion CSS, not in UI)

**Preset Format:**

Presets are **JSON files** (`themes/{name}.json`) with a `PresetJSON` schema: `version`, `name`, `light`, `dark`, and optional `shadowComponents`. Optional companion `.css` files for custom CSS overrides.

**Color Palette Development:**

- Brand color as foundation
- Surface hierarchy: raised (lightest) → default → lowered (darkest)
- Text colors with WCAG AA contrast (4.5:1 for normal, 3:1 for quiet)
- Dark mode: inverted surface hierarchy, adjusted text colors

**8 Existing Presets:**

- **midnight-blue**: Blue brand, elegant typography, soft shadows
- **ocean-breeze**: Teal/cyan, airy spacing, rounded corners
- **neo-brutalism**: Bold orange, sharp corners (radius=0), thick borders
- **warm-earth**: Brown/orange, generous spacing, organic feel
- **monochrome**: Grayscale only, minimal, clean
- **canvas**: Figma-inspired, black & white, hard shadows
- **kanban**: Atlassian-inspired, blue brand, functional
- **shopaholic**: Shopify-inspired, green brand, subtle shadows

**Example:**

```
User: "Create a warm sunset theme preset"
→ Skill develops orange/coral palette
→ Chooses Source Sans 3 + Bitter fonts
→ Configures generous spacing (1.3), rounded corners (1.5)
→ Creates docs/src/kigumi-studio/themes/warm-sunset.json
→ Validates via preset-schema.test.ts
→ Theme appears in Studio dropdown automatically
```

**Full documentation:** [skills/generate-kigumi-theme-preset/SKILL.md](skills/generate-kigumi-theme-preset/SKILL.md)

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
