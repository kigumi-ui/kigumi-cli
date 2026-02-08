# Kigumi Agent Skills

AI-powered transformation of Web Awesome code to framework-specific Kigumi components.

## Available Skills

| Skill                         | Framework | Description                                                                       |
| ----------------------------- | --------- | --------------------------------------------------------------------------------- |
| [kigumi-react](kigumi-react/) | React     | Transform Web Awesome HTML to React components with automatic component detection |

> **Coming Soon**: Vue, Svelte, and Angular skills will be added when templates become available.

## Installation

### Option 1: Using skills CLI (Recommended)

```bash
# Install from kigumi.style (no npm package needed!)
npx skills add https://kigumi.style/skills/kigumi-react

# Or from npm package (after installing kigumi)
npm install kigumi
npx skills add ./node_modules/kigumi/dist/skills/kigumi-react
```

### Option 2: Manual Installation

**For Cursor:**

```bash
# Download from kigumi.style
curl -L https://kigumi.style/skills/kigumi-react.tar.gz | tar -xz -C ~/.cursor/skills/

# Or from installed package
cp -r ./node_modules/kigumi/dist/skills/kigumi-react .cursor/skills/
```

**For Claude Code:**

```bash
# Download from kigumi.style
curl -L https://kigumi.style/skills/kigumi-react.tar.gz | tar -xz -C ~/.claude/skills/

# Or from installed package
cp -r ./node_modules/kigumi/dist/skills/kigumi-react .claude/skills/
```

**For VS Code (with supported extensions):**

```bash
mkdir -p .vscode/skills
cp -r ./node_modules/kigumi/dist/skills/kigumi-react .vscode/skills/
```

## How Skills Work

### 1. Trigger

Paste Web Awesome HTML and ask your AI assistant to "convert to Kigumi React":

```html
<wa-card>
  <div slot="header">User Profile</div>
  <wa-avatar label="User avatar"></wa-avatar>
  <wa-button variant="brand">View Profile</wa-button>
</wa-card>
```

### 2. Detection

The skill:

- Reads `kigumi.config.json` for project settings (framework, TypeScript, paths)
- Scans your `componentsDir` to see which components are installed
- Identifies missing components from the Web Awesome snippet

### 3. Analysis

If components are missing:

```bash
# Install missing components first:
npx kigumi add avatar
```

### 4. Output

Generates framework-specific code with proper imports:

```tsx
import { Avatar, Button, Card } from '@/components/ui';

export default function UserProfile() {
  return (
    <Card>
      <div slot="header">User Profile</div>
      <Avatar label="User avatar" />
      <Button variant="brand">View Profile</Button>
    </Card>
  );
}
```

## Example Usage

### Basic Transformation

**Input** (paste into AI chat):

```
Convert this to Kigumi React:

<wa-button variant="brand" size="large">
  <wa-icon slot="start" name="check"></wa-icon>
  Confirm
</wa-button>
```

**Output**:

```tsx
import { Button, Icon } from '@/components/ui';

<Button variant="brand" size="large">
  <Icon slot="start" name="check" />
  Confirm
</Button>;
```

### With Missing Components

**Input**:

```
Transform to Kigumi:

<wa-dialog label="Confirm Action">
  Are you sure?
  <wa-button slot="footer">Cancel</wa-button>
</wa-dialog>
```

**Output** (if Dialog not installed):

```bash
# Install missing components first:
npx kigumi add dialog
```

```tsx
import { Button, Dialog } from '@/components/ui';

<Dialog label="Confirm Action">
  Are you sure?
  <Button slot="footer">Cancel</Button>
</Dialog>;
```

## Features

### ✅ Component Detection

Automatically detects which Kigumi components are installed in your project and suggests missing ones.

### ✅ TypeScript/JavaScript Support

Generates appropriate syntax based on your `kigumi.config.json` settings.

### ✅ Framework Awareness

Reads your project configuration to ensure correct imports and syntax.

### ✅ Web Awesome Utilities Preserved

Keeps Web Awesome CSS utility classes (`wa-stack`, `wa-cluster`, etc.) intact.

### ✅ Smart Transformations

- `class` → `className`
- `style="..."` → `style={{ }}`
- `<wa-icon />` → `<Icon />`
- Event handlers: `wa-change` → `onChange`

## Requirements

### Project Setup

Your project must have a `kigumi.config.json` file. If not, run:

```bash
npx kigumi init
```

### Example Configuration

```json
{
  "framework": "react",
  "typescript": true,
  "componentsDir": "src/components/ui",
  "utilsDir": "src/lib",
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "red"
  },
  "aliases": {
    "@/components": "./src/components",
    "@/lib": "./src/lib"
  }
}
```

## Cross-Platform Compatibility

These skills follow the [Agent Skills Standard](https://agentskills.io) and work with:

- ✅ Cursor
- ✅ Claude Code
- ✅ VS Code (with compatible extensions)
- ✅ Any tool supporting the Agent Skills specification

## Troubleshooting

### Skill not triggering?

**Check installation:**

```bash
# Cursor
ls ~/.cursor/skills/kigumi-react/

# Claude Code
ls ~/.claude/skills/kigumi-react/
```

Ensure `SKILL.md` exists in the skill folder.

### Wrong framework detected?

Verify your `kigumi.config.json`:

```bash
cat kigumi.config.json | grep framework
```

Use the skill matching your project framework.

### Components not found?

**Check your config:**

```bash
cat kigumi.config.json | grep componentsDir
```

**List installed components:**

```bash
npx kigumi status
```

### Config file missing?

Initialize Kigumi in your project:

```bash
npx kigumi init
```

## Learn More

- **Kigumi CLI**: [kigumi.style](https://kigumi.style)
- **Web Awesome**: [webawesome.com](https://webawesome.com)
- **Agent Skills Standard**: [agentskills.io](https://agentskills.io)
- **Report Issues**: [github.com/Siregar/kigumi-cli/issues](https://github.com/Siregar/kigumi-cli/issues)

---

Made with ❤️ by the Kigumi team
