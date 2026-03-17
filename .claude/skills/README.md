# Kigumi Agent Skills

## Skill Selection Guide

| User Intent | Skill | Audience |
|---|---|---|
| Convert WA HTML to React | `kigumi-react` | End user |
| Convert WA HTML to Vue | `kigumi-vue` | End user |
| Build a form with validation | `kigumi-compose-form` | End user |
| Build a page layout / dashboard | `kigumi-compose-layout` | End user |
| Build a modal / drawer / dropdown | `kigumi-compose-overlay` | End user |
| Build a data table / stats / list | `kigumi-compose-data` | End user |
| Customize theme / colors / dark mode | `kigumi-theme` | End user |
| Generate component wrapper templates | `generate-component-wrapper` | Contributor |
| Create theme presets for Studio | `generate-theme-preset` | Contributor |
| Prepare a release | `release` | Contributor |

## How Skills Work

Each skill is a `.claude/skills/{name}/SKILL.md` file with YAML frontmatter that tells the AI agent when to activate and what tools it can use. Reference files in `references/` provide detailed patterns and code examples.

## Composition Skills

The `kigumi-compose-*` skills teach agents how to **build complete features** (not just convert individual components):

- **compose-form** -- Forms with state management, validation, error handling, async submission
- **compose-layout** -- Page layouts using WA utility classes (.wa-stack, .wa-grid, .wa-flank)
- **compose-overlay** -- Modals, drawers, dropdown menus, toasts with correct state patterns
- **compose-data** -- Data tables, stats dashboards, list views, empty/loading states

These skills are **combinable**: compose-form + compose-overlay = form-in-a-dialog.
