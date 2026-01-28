# Cursor Skills

> Automated workflows for Kigumi CLI development

## Available Skills

| Skill                          | Location                                                                               | Purpose                                     |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Generate Web Awesome Component | [skills/generate-webawesome-component/](skills/generate-webawesome-component/SKILL.md) | Create React wrappers from Web Awesome docs |

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
