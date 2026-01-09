# Fix Strategy - User-First Approach

## Core Problem

**I broke the CLI by:**

1. Refactoring without testing the actual user flow
2. Relying only on unit tests that mock everything
3. Not verifying each command actually works end-to-end
4. Assuming "tests pass" = "CLI works"

**Reality**: Unit tests with mocks give FALSE POSITIVES. They test code paths, not real functionality.

---

## New Development Philosophy

### 1. User Flow First, Tests Second

**Before ANY code change:**

```bash
# Test as a user would:
cd test-project
node ../dist/index.js init --framework react --tier free --theme default
node ../dist/index.js install
node ../dist/index.js add button
npm run dev
# Open browser → Does it work?
```

**Only AFTER manual verification by ONLY using the CLI, no manual npm commands that should be solved by the CLI → Write tests to prevent regression**

### 2. Real Projects, No Mocks

- ✅ Create actual Vite projects
- ✅ Run actual commands
- ✅ Check actual files created
- ✅ Install actual dependencies
- ✅ Run actual dev server
- ✅ Open actual browser
- ❌ NO file system mocks
- ❌ NO command mocks
- ❌ NO "assume it works"

### 3. Every Command = Manual Test FIRST

**For each command:**

1. Create fresh Vite project
2. Run command with real flags
3. Verify output in terminal
4. Check files on disk
5. Test in browser if UI-related
6. Document what works/doesn't work
7. Fix issues
8. Repeat steps 1-6
9. ONLY THEN write automated test

---

## Fix Order (Priority-Based)

### Phase 0: Understand What's Broken (1 hour)

**Goal**: Complete picture of all broken functionality

**Tasks**:

1. ✅ Test init command (DONE - found file generation fails)
2. ✅ Test install command (DONE - found config loading fails)
3. Test add command (need to fix install first)
4. Test theme commands (need working project first)
5. Test list command (low priority, likely works)

**Deliverable**: Complete list of broken features with reproduction steps

---

### Phase 1: Fix Init Command (3-4 hours)

**Goal**: `kigumi init` creates a working project

#### Step 1.1: Debug File Generation Failure

**Actions**:

```bash
cd /Users/giregar/Documents/dev/git/kigumi-cli
cd tests/react4
rm -rf src/lib src/components/ui src/styles .env .npmrc
node ../../dist/index.js init --framework react --tier pro --theme brutalist --palette rudimentary --brand red --token test-token
```

**Check**:

- [ ] Command completes without "File generation failed"
- [ ] src/lib/ directory created
- [ ] src/components/ui/ directory created
- [ ] src/styles/ directory created
- [ ] src/lib/webawesome.ts exists and has correct imports
- [ ] src/styles/theme.css exists and has correct theme
- [ ] src/vite-env.d.ts exists (for TypeScript)
- [ ] .env exists with WEBAWESOME_NPM_TOKEN
- [ ] .npmrc exists with Cloudsmith config

**If ANY check fails → Debug specific file generation step**

#### Step 1.2: Fix Brand Color Parameter

**Check**: After init, verify `kigumi-components.json` has:

```json
{
  "theme": {
    "brandColor": "red" // NOT "blue"
  }
}
```

**If wrong → Fix src/schemas/options.ts and src/commands/init/config-builder.ts**

#### Step 1.3: Verify Init Works End-to-End

**Test script**:

```bash
# Clean slate
cd tests
rm -rf react-test-1
npm create vite@latest react-test-1 -- --template react-ts
cd react-test-1
npm install

# Add path aliases to tsconfig/vite config (document this step!)

# Run init
node ../../dist/index.js init --framework react --tier free --theme default

# Verify
ls -la src/lib/
cat src/lib/webawesome.ts
cat kigumi-components.json

# Success criteria:
# - All files exist
# - No errors in terminal
# - Config matches input
```

**Only proceed to Phase 2 when init command works 100%**

---

### Phase 2: Fix Install Command (2-3 hours)

**Goal**: `kigumi install` installs Web Awesome + dependencies

#### Step 2.1: Debug Config Loading

**Actions**:

```bash
cd tests/react4
# Config exists from Phase 1
node ../../dist/index.js install
```

**If fails with "Configuration not loaded":**

1. Add debug logging to `src/utils/config.ts`:

   ```typescript
   export async function loadConfig(cwd: string): Promise<KigumiConfig | null> {
     console.log('[DEBUG] Loading config from:', cwd);
     const configPath = path.join(cwd, 'kigumi-components.json');
     console.log('[DEBUG] Config path:', configPath);

     const exists = await fs.pathExists(configPath);
     console.log('[DEBUG] Config exists:', exists);

     if (!exists) return null;

     const data = await fs.readJson(configPath);
     console.log('[DEBUG] Config data:', JSON.stringify(data, null, 2));

     return data;
   }
   ```

2. Run install again, check debug output
3. Identify WHERE it fails (file read? validation? parsing?)
4. Fix that specific issue

#### Step 2.2: Fix Config Validation

**If Zod validation fails:**

- Check what field is invalid
- Update schema OR fix config generation
- Verify schema matches actual config structure

#### Step 2.3: Verify Install Works

**Test script**:

```bash
cd tests/react-test-1
node ../../dist/index.js install

# Check package.json
cat package.json | grep webawesome

# Check node_modules
ls node_modules/@awesome.me/

# Success criteria:
# - @awesome.me/webawesome installed
# - clsx installed (for React)
# - No errors
```

---

### Phase 3: Fix Add Command (2-3 hours)

**Goal**: `kigumi add button` creates working component

#### Step 3.1: Verify Add Command

**Test script**:

```bash
cd tests/react-test-1
node ../../dist/index.js add button

# Check
ls src/components/ui/Button/
cat src/components/ui/Button/Button.tsx
cat src/lib/webawesome.ts  # Should have button import

# Success criteria:
# - Button.tsx created
# - Button.css created
# - webawesome.ts updated with button import
```

#### Step 3.2: Test Multiple Components

```bash
node ../../dist/index.js add input card dialog

ls src/components/ui/
# Should have: Button/ Input/ Card/ Dialog/
```

#### Step 3.3: Verify in Browser

**CRITICAL STEP** - This is where unit tests fail us!

```bash
# Create App.tsx using ALL added components
cat > src/App.tsx << 'EOF'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { Card } from '@/components/ui/Card/Card'
import { Dialog } from '@/components/ui/Dialog/Dialog'
import '@/lib/webawesome'
import './App.css'

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Kigumi Test</h1>

      <Card>
        <h2>Components Test</h2>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <Button>Click me</Button>
          <Input placeholder="Type here" />
          <Dialog>
            <div slot="label">Test Dialog</div>
            <p>Dialog content</p>
          </Dialog>
        </div>
      </Card>
    </div>
  )
}

export default App
EOF

# Run dev server
npm run dev

# Open http://localhost:5173
# Manual checks:
# - [ ] Button renders with theme styles
# - [ ] Input renders correctly
# - [ ] Card has proper styling
# - [ ] Dialog can open/close
# - [ ] No console errors
# - [ ] Theme colors are visible
```

**If ANY component doesn't work → Fix it before proceeding**

---

### Phase 4: Fix Theme Commands (1-2 hours)

**Goal**: Theme switching actually works in browser

#### Step 4.1: Test Theme Command

```bash
cd tests/react-test-1

# Initial theme is 'default'
# Browser shows default theme colors

node ../../dist/index.js theme awesome

# Verify config updated
cat kigumi-components.json | grep selected

# Verify webawesome.ts updated
cat src/lib/webawesome.ts | grep theme

# Reload browser → Colors should change
```

#### Step 4.2: Test Palette Command

```bash
node ../../dist/index.js palette bright

# Reload browser → Palette should change
```

#### Step 4.3: Test Brand Command

```bash
node ../../dist/index.js brand purple

# Reload browser → Brand color should change
```

**Success Criteria**: Visual changes in browser after each command

---

### Phase 5: Document User Setup (1 hour)

**Goal**: User knows EXACTLY what to do

Create `QUICK-START.md`:

```markdown
# Quick Start

## Prerequisites

- Node.js 18+
- npm/pnpm/yarn/bun

## Step 1: Create Vite Project

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
\`\`\`

## Step 2: Configure Path Aliases

**tsconfig.app.json**:
\`\`\`json
{
"compilerOptions": {
// ... existing config
"baseUrl": ".",
"paths": {
"@/_": ["./src/_"]
}
}
}
\`\`\`

**vite.config.ts**:
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
plugins: [react()],
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src'),
},
},
})
\`\`\`

## Step 3: Initialize Kigumi

\`\`\`bash
npx @kigumi/cli init
\`\`\`

## Step 4: Install Dependencies

\`\`\`bash
npx @kigumi/cli install
\`\`\`

## Step 5: Add Components

\`\`\`bash
npx @kigumi/cli add button input card
\`\`\`

## Step 6: Use Components

\`\`\`typescript
import { Button } from '@/components/ui/Button/Button'
import '@/lib/webawesome'

function App() {
return <Button>Click me</Button>
}
\`\`\`
```

---

## Testing Strategy Moving Forward

### Rule 1: Manual Test FIRST

For EVERY PR:

1. Create fresh Vite project
2. Run full workflow manually
3. Test in browser
4. Document results
5. ONLY THEN merge

### Rule 2: Real E2E Tests

```typescript
// tests/e2e/real-workflow.test.ts
describe('Real User Workflow', () => {
  it('creates working project from scratch', async () => {
    // 1. Create actual Vite project
    await execa('npm', [
      'create',
      'vite@latest',
      'test-e2e',
      '--',
      '--template',
      'react-ts',
    ]);

    // 2. Run actual init command
    await execa('node', ['dist/index.js', 'init', ...flags], {
      cwd: 'test-e2e',
    });

    // 3. Check actual files
    expect(fs.existsSync('test-e2e/src/lib/webawesome.ts')).toBe(true);

    // 4. Run actual install
    await execa('node', ['dist/index.js', 'install'], { cwd: 'test-e2e' });

    // 5. Verify actual dependencies
    const pkg = require('./test-e2e/package.json');
    expect(pkg.dependencies['@awesome.me/webawesome']).toBeDefined();
  });
});
```

### Rule 3: Browser Testing

- Use Playwright for actual browser tests
- Verify components render
- Verify themes apply
- Verify no console errors

---

## Success Metrics

### Before ANY commit:

- [ ] Fresh Vite project created
- [ ] Init command works without errors
- [ ] All files generated correctly
- [ ] Install command works
- [ ] Dependencies installed
- [ ] Add command works
- [ ] Components created
- [ ] Dev server starts
- [ ] Browser shows components
- [ ] Theme commands work
- [ ] Visual changes in browser
- [ ] Zero console errors

### Definition of "Works":

- ✅ Command exits with code 0
- ✅ Expected files exist on disk
- ✅ Files have correct content
- ✅ App runs in browser
- ✅ Components render correctly
- ✅ Theme is applied
- ✅ No errors anywhere

**If ANY check fails → NOT READY**

---

## Lessons Learned

### What Went Wrong:

1. ❌ Trusted unit tests too much
2. ❌ Mocked file system operations
3. ❌ Never ran actual commands
4. ❌ Never tested in browser
5. ❌ Assumed refactoring couldn't break things
6. ❌ Said "production ready" without verification

### What to Do Instead:

1. ✅ Manual test every change
2. ✅ Use real file system
3. ✅ Run real commands
4. ✅ Test in real browser
5. ✅ Verify after every refactor
6. ✅ Only claim "production ready" after full user test

---

## Implementation Plan

**Week 1**:

- Day 1: Fix init command file generation
- Day 2: Fix init command brand parameter
- Day 3: Fix install command config loading
- Day 4: Fix add command, test in browser
- Day 5: Fix theme commands, verify visual changes

**Week 2**:

- Day 1-2: Write real E2E tests
- Day 3: Add browser tests with Playwright
- Day 4: Document setup process
- Day 5: Full manual verification

**Definition of Done**:
New user follows QUICK-START.md → Has working app in 10 minutes

---

## Current Status

**What Works**: ❌ Almost nothing
**What's Broken**: ✅ Everything critical
**Estimated Fix Time**: 10-15 hours
**Real Status**: Pre-alpha, not production ready
