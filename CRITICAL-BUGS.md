# Critical Bugs Found - CLI NOT Production Ready

## Test Scenario
User creates React4 project and tries to initialize with Kigumi CLI Pro tier.

Command used:
```bash
node dist/index.js init --framework react --tier pro --theme brutalist --palette rudimentary --brand red --token v7YAcspt5xaaAe_9l_tr8
```

## Critical Bugs Discovered

### Bug #1: Init Command File Generation Fails Silently
**Severity**: CRITICAL
**Location**: `src/commands/init/file-generator.ts`

**Symptoms**:
- Init command shows "File generation failed"
- No error details provided
- Config file is created but directories are not
- No .env file created
- No webawesome.ts created
- No theme.css created
- No vite-env.d.ts created

**Expected**:
- All files should be generated
- Proper error messages if something fails
- Should not fail silently

**What was created**:
- ✅ kigumi-components.json
- ❌ src/components/ui/ directory
- ❌ src/lib/ directory
- ❌ src/styles/ directory
- ❌ .env file
- ❌ .npmrc file
- ❌ src/lib/webawesome.ts
- ❌ src/styles/theme.css
- ❌ src/vite-env.d.ts

---

### Bug #2: Brand Color Parameter Ignored
**Severity**: HIGH
**Location**: `src/commands/init/config-builder.ts`

**Symptoms**:
- User specified `--brand red`
- Config shows `"brandColor": "blue"`
- Default value used instead of provided parameter

**Config Created**:
```json
{
  "theme": {
    "selected": "brutalist",
    "palette": "rudimentary",
    "brandColor": "blue"  // ❌ Should be "red"
  }
}
```

**Root Cause**:
The `--brand` parameter is not being properly passed through the non-interactive config builder.

---

### Bug #3: Install Command Fails with "Configuration not loaded"
**Severity**: CRITICAL
**Location**: `src/commands/install.ts` or `src/checks/config-checks.ts`

**Symptoms**:
```
┌   kigumi install
│
■  Pre-flight checks failed
│
◇  Issues found ─────────────────╮
│                                │
│  Errors (1):                   │
│    ✗ Configuration not loaded  │
│                                │
├────────────────────────────────╯
```

**Config File Exists**: ✅ Yes (`kigumi-components.json` is present)
**Config File Valid**: ✅ Yes (valid JSON structure)

**Root Cause**:
Either:
1. ConfigValidCheck is rejecting valid config
2. loadConfig() is failing to parse the config
3. Zod validation is too strict

---

## Unable to Continue Testing

Cannot proceed with:
- ❌ Step 3: Add components (install command broken)
- ❌ Step 4: Create component overview (no components)
- ❌ Step 5: Theme switching (dependencies not installed)

## Root Cause Analysis

### Problem 1: Error Handling in Init Command
The init command is catching errors but not properly reporting them. The file-generator.ts likely throws an error that gets swallowed.

**Fix Required**:
```typescript
// In src/commands/init/file-generator.ts
try {
  await generateProjectFiles(cwd, config, output);
} catch (error) {
  // Currently just shows "File generation failed"
  // Should show: WHAT failed and WHY
  output.error('File generation failed', error);
  throw error; // Re-throw so user knows it failed
}
```

### Problem 2: Config Builder Not Mapping Brand Parameter
The non-interactive config builder in `buildConfigNonInteractive()` is not mapping the `--brand` flag to `brandColor` property.

**Fix Required**:
```typescript
// In src/commands/init/config-builder.ts
export async function buildConfigNonInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  output: OutputInterface
): Promise<KigumiConfig> {
  // ...
  theme: {
    selected: options.theme!,
    palette: options.palette || 'default',
    brandColor: options.brand || 'blue',  // ❌ BUG: options.brand is undefined
  }
}
```

The issue is the InitOptions schema is likely not including `brand` field.

### Problem 3: Config Validation Too Strict or Wrong CWD
The install command pre-flight checks are failing to load config even though it exists.

**Possible Issues**:
1. `loadConfig()` is looking in wrong directory
2. Zod validation rejecting valid config
3. ConfigValidCheck has wrong logic

**Debug Needed**:
```typescript
// Check what loadConfig returns
const config = await loadConfig(cwd);
console.log('Config loaded:', config);
console.log('CWD:', cwd);
```

---

## What Actually Works

✅ Config file creation (kigumi-components.json)
✅ Theme selection (brutalist)
✅ Palette selection (rudimentary)
✅ Tier selection (pro)
❌ Brand color parameter
❌ File generation
❌ Directory creation
❌ Dependency installation
❌ Install command

---

## Estimated Fix Effort

1. **File Generation Bug** - 1-2 hours
   - Debug why generateProjectFiles() fails
   - Fix error handling
   - Add proper error messages

2. **Brand Color Parameter** - 30 minutes
   - Add `brand` field to InitOptions schema
   - Map it correctly in config builder

3. **Install Command Bug** - 1-2 hours
   - Debug why config loading fails
   - Fix ConfigValidCheck logic
   - Test with valid configs

4. **Integration Testing** - 2-3 hours
   - Write end-to-end test
   - Test all commands in sequence
   - Verify in browser

**Total**: 5-8 hours of work needed

---

## Conclusion

The CLI is **NOT production ready**. Core functionality is broken:
- Init command doesn't complete file generation
- Install command can't load valid configs
- Parameters are ignored

The refactoring introduced regressions that weren't caught by unit tests because:
1. Unit tests mock file system
2. Integration tests don't run full command flow
3. No end-to-end testing with real projects

**Recommendation**: Before Phase 4 (documentation), fix these critical bugs and add proper end-to-end tests.
