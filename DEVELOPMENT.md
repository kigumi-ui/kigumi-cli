# Development Guide

## Testing the CLI Locally

There are three ways to test the CLI during development:

### Option 1: npm link (Recommended)

This creates a global symlink to your local CLI, simulating an installed package.

```bash
# In kigumi-cli root directory:
npm run build
npm link

# Now you can use 'kigumi' anywhere:
cd test-project
kigumi init
kigumi add button

# To unlink when done:
npm unlink -g @kigumi/cli
```

**Pros:**
- Most realistic - works exactly like `npx kigumi`
- Can use `kigumi` command anywhere
- No need to rebuild for each test (but rebuild when you change code)

**Cons:**
- Need to remember to rebuild after changes
- Global installation (can conflict with published version)

---

### Option 2: Direct Node Execution

Run the built CLI directly with Node:

```bash
# In kigumi-cli root directory:
npm run build

# In test-project:
cd test-project
node ../dist/index.js init
node ../dist/index.js add button
```

**Pros:**
- Simple and direct
- No global installation

**Cons:**
- Need to specify full path
- Need to rebuild after each change

---

### Option 3: tsx (Development Mode)

Use tsx to run TypeScript directly without building:

```bash
# In test-project:
npx tsx ../src/index.ts init
npx tsx ../src/index.ts add button
```

**Pros:**
- No build step needed
- Fastest iteration during development

**Cons:**
- Slower execution (TypeScript compilation on the fly)
- Different from production behavior

---

## Recommended Workflow

### During Active Development:
```bash
# Terminal 1 - Watch mode (auto-rebuild on changes):
npm run dev

# Terminal 2 - Use linked CLI:
cd test-project
kigumi init  # (after running 'npm link' once)
```

### For Testing Like Production:
```bash
# Build and link:
npm run build
npm link

# Test in any directory:
cd test-project
kigumi init
```

### Quick One-Off Tests:
```bash
# Build and run directly:
npm run build && cd test-project && node ../dist/index.js init
```

---

## Simulating `npx kigumi` / `pnpm dlx kigumi`

The `npm link` approach is the closest simulation. After linking:

```bash
# These work the same as the published package:
kigumi init
kigumi add button
kigumi theme list

# You can also use npx with the linked version:
npx kigumi init
```

---

## Testing Changes

1. Make changes to source files in `src/`
2. Rebuild: `npm run build`
3. Test in test-project: `cd test-project && kigumi init`
4. Verify the behavior

---

## Cleaning Up Test Project

To reset test-project for fresh testing:

```bash
cd test-project
rm -rf node_modules
rm kigumi-components.json
rm -rf src/components/ui
rm -rf src/lib/webawesome.ts
rm -rf src/types/web-awesome.d.ts
rm .env
```

Or create a fresh test app:
```bash
npm create vite@latest my-test-app -- --template react-ts
cd my-test-app
npm install
kigumi init
```

---

## Publishing Simulation

To test the full publishing workflow locally:

```bash
# Pack the package (creates a .tgz file):
npm run build
npm pack

# Install from the tarball in a test project:
cd test-project
npm install ../kigumi-cli-0.1.0.tgz

# Test:
npx kigumi init
```

This is the closest to how users will install via `npx @kigumi/cli@latest init`.
