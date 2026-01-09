# Bugfix Plan - Make CLI Production Ready

## Priority Order

### 🔴 P0: Blocking Bugs (Must Fix)
1. Init command file generation failure
2. Install command config loading failure
3. Brand color parameter ignored

### 🟡 P1: High Priority (Should Fix)
4. Error messages too vague
5. Missing end-to-end tests

---

## Bug #1: Init Command File Generation Failure

### Investigation Steps
1. Add debug logging to file-generator.ts
2. Check each file generation step
3. Identify which step fails
4. Check if directories exist before writing files

### Likely Root Cause
```typescript
// In src/commands/init/file-generator.ts
export async function generateProjectFiles(
  cwd: string,
  config: KigumiConfig,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Generating project files...');

  try {
    // Directory creation
    await fs.ensureDir(path.join(cwd, config.componentsDir));
    await fs.ensureDir(path.join(cwd, config.utilsDir));
    await fs.ensureDir(path.join(cwd, 'src/styles'));

    // Generate webawesome.ts
    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);

    // Generate theme.css
    const themeContent = await generateThemeCSS(config);
    await fs.writeFile(
      path.join(cwd, 'src/styles/theme.css'),
      themeContent
    );

    // Generate vite-env.d.ts for TypeScript
    if (config.typescript) {
      await generateViteEnvDts(cwd, 'src');
    }

    // Generate .gitignore
    await generateGitIgnore(cwd);

    // For Pro tier: create .env file
    if (config.webAwesome?.tier === 'pro') {
      const envPath = path.join(cwd, '.env');
      const envContent = `# Web Awesome Pro authentication token
# Get your token from https://webawesome.com
WEBAWESOME_NPM_TOKEN=your-token-here
`;
      await fs.writeFile(envPath, envContent);
    }

    spinner.stop('Files generated');
  } catch (error) {
    spinner.error('File generation failed');
    // ❌ BUG: Error is not being logged or re-thrown!
    // Should be:
    output.error('Failed to generate files', error as Error);
    throw error;
  }
}
```

**Problem**: The try-catch swallows the error without proper reporting.

### Fix Implementation

**File**: `src/commands/init/file-generator.ts`

```typescript
export async function generateProjectFiles(
  cwd: string,
  config: KigumiConfig,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Generating project files...');

  try {
    // 1. Create directories
    output.log('Creating directories...');
    await fs.ensureDir(path.join(cwd, config.componentsDir));
    await fs.ensureDir(path.join(cwd, config.utilsDir || 'src/lib'));
    await fs.ensureDir(path.join(cwd, 'src/styles'));

    // 2. Generate webawesome.ts
    output.log('Generating webawesome.ts...');
    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);

    // 3. Generate theme.css
    output.log('Generating theme.css...');
    const themeContent = await generateThemeCSS(config);
    await fs.writeFile(
      path.join(cwd, 'src/styles/theme.css'),
      themeContent
    );

    // 4. Generate vite-env.d.ts
    if (config.typescript) {
      output.log('Generating vite-env.d.ts...');
      await generateViteEnvDts(cwd, 'src');
    }

    // 5. Generate .gitignore
    output.log('Updating .gitignore...');
    await generateGitIgnore(cwd);

    // 6. Generate .env for Pro tier
    if (config.webAwesome?.tier === 'pro') {
      output.log('Creating .env file...');
      const envPath = path.join(cwd, '.env');
      const envContent = `# Web Awesome Pro authentication token
# Get your token from https://webawesome.com
WEBAWESOME_NPM_TOKEN=your-token-here
`;
      await fs.writeFile(envPath, envContent);

      // Also create .npmrc
      output.log('Creating .npmrc file...');
      const npmrcPath = path.join(cwd, '.npmrc');
      const npmrcContent = `@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/
//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=\${WEBAWESOME_NPM_TOKEN}
`;
      await fs.writeFile(npmrcPath, npmrcContent);
    }

    spinner.stop('Files generated');
  } catch (error) {
    spinner.error('File generation failed');
    // ✅ FIX: Proper error handling
    if (error instanceof Error) {
      output.error(`Failed to generate files: ${error.message}`, error);
    }
    throw error;
  }
}
```

---

## Bug #2: Brand Color Parameter Ignored

### Investigation
Check `src/schemas/index.ts` for InitOptions schema definition.

### Likely Root Cause

**File**: `src/schemas/options.ts`

```typescript
// ❌ CURRENT: Missing 'brand' field
export const initOptionsSchema = z.object({
  framework: z.string().optional(),
  typescript: z.boolean().optional(),
  tier: z.string().optional(),
  theme: z.string().optional(),
  palette: z.string().optional(),
  // brand: z.string().optional(),  // ❌ MISSING!
  token: z.string().optional(),
  componentsDir: z.string().optional(),
  utilsDir: z.string().optional(),
  cwd: z.string().optional(),
});
```

### Fix Implementation

**File**: `src/schemas/options.ts`

```typescript
export const initOptionsSchema = z.object({
  framework: z.string().optional(),
  typescript: z.boolean().optional(),
  tier: z.string().optional(),
  theme: z.string().optional(),
  palette: z.string().optional(),
  brand: z.string().optional(),  // ✅ ADD THIS
  token: z.string().optional(),
  componentsDir: z.string().optional(),
  utilsDir: z.string().optional(),
  cwd: z.string().optional(),
});

export type InitOptions = z.infer<typeof initOptionsSchema>;
```

**File**: `src/commands/init/config-builder.ts`

```typescript
export async function buildConfigNonInteractive(
  options: InitOptions,
  projectInfo: ProjectInfo,
  output: OutputInterface
): Promise<KigumiConfig> {
  // Validate all required options present
  if (!options.framework || !options.tier || !options.theme) {
    throw new Error('Missing required options for non-interactive mode');
  }

  const config: KigumiConfig = {
    framework: options.framework as 'react' | 'vue' | 'svelte',
    typescript: options.typescript ?? true,
    componentsDir: options.componentsDir || 'src/components/ui',
    utilsDir: options.utilsDir || 'src/lib',
    theme: {
      selected: options.theme,
      palette: options.palette || 'default',
      brandColor: options.brand || 'blue',  // ✅ USE options.brand
    },
    webAwesome: {
      tier: options.tier as 'free' | 'pro',
      version: '^3.1.0',
    },
  };

  return config;
}
```

---

## Bug #3: Install Command Config Loading Failure

### Investigation Steps
1. Check what `loadConfig()` returns
2. Verify CWD is correct
3. Check Zod validation errors
4. Verify ConfigValidCheck logic

### Likely Root Cause

**File**: `src/checks/config-checks.ts`

```typescript
export class ConfigValidCheck implements Check {
  readonly id = 'config-valid';
  readonly name = 'Configuration Valid';
  readonly description = 'Validates configuration file structure';

  async run(context: CheckContext): Promise<CheckResult> {
    try {
      const config = await loadConfig(context.cwd);

      // ❌ BUG: loadConfig might return null but we don't check
      if (!config) {
        return {
          passed: false,
          severity: CheckSeverity.ERROR,
          message: 'Configuration not loaded',  // ❌ This is what user sees!
        };
      }

      // Validate with Zod schema
      validators.config(config);

      return {
        passed: true,
        severity: CheckSeverity.INFO,
        message: 'Configuration is valid',
      };
    } catch (error) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: `Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
```

### Fix Implementation

**Option A**: Fix loadConfig to throw instead of returning null

**File**: `src/utils/config.ts`

```typescript
export async function loadConfig(cwd: string): Promise<KigumiConfig | null> {
  const configPath = path.join(cwd, 'kigumi-components.json');

  try {
    if (!(await fs.pathExists(configPath))) {
      return null;  // File doesn't exist - this is OK
    }

    const configData = await fs.readJson(configPath);

    // ❌ BUG: No validation here!
    // Should validate before returning
    try {
      validators.config(configData);
    } catch (error) {
      throw new Error(`Invalid config format: ${error.message}`);
    }

    return configData as KigumiConfig;
  } catch (error) {
    // ✅ Better error message
    throw new Error(`Failed to load config: ${error.message}`);
  }
}
```

**Option B**: Fix ConfigValidCheck to provide better errors

```typescript
export class ConfigValidCheck implements Check {
  async run(context: CheckContext): Promise<CheckResult> {
    try {
      const configPath = path.join(context.cwd, 'kigumi-components.json');

      // Check file exists
      if (!(await fs.pathExists(configPath))) {
        return {
          passed: false,
          severity: CheckSeverity.ERROR,
          message: 'Configuration file not found',
          suggestion: ['Run: kigumi init'],
        };
      }

      // Read config
      let configData;
      try {
        configData = await fs.readJson(configPath);
      } catch (error) {
        return {
          passed: false,
          severity: CheckSeverity.ERROR,
          message: `Failed to parse config: ${error.message}`,
          suggestion: ['Check kigumi-components.json for syntax errors'],
        };
      }

      // Validate config
      try {
        validators.config(configData);
      } catch (error) {
        return {
          passed: false,
          severity: CheckSeverity.ERROR,
          message: `Invalid configuration: ${error.message}`,
          suggestion: ['Fix kigumi-components.json', 'Or run: kigumi init'],
        };
      }

      return {
        passed: true,
        severity: CheckSeverity.INFO,
        message: 'Configuration is valid',
      };
    } catch (error) {
      return {
        passed: false,
        severity: CheckSeverity.ERROR,
        message: `Config validation error: ${error.message}`,
      };
    }
  }
}
```

---

## End-to-End Test to Add

**File**: `tests/e2e/full-workflow.test.ts`

```typescript
describe('Full User Workflow E2E', () => {
  let testProjectDir: string;

  beforeEach(async () => {
    // Create actual Vite project
    testProjectDir = await createViteProject('react-ts');
  });

  afterEach(async () => {
    await fs.remove(testProjectDir);
  });

  it('should complete full init → add → theme workflow', async () => {
    // 1. Init with Pro tier
    await execCommand([
      'init',
      '--framework', 'react',
      '--tier', 'pro',
      '--theme', 'brutalist',
      '--palette', 'rudimentary',
      '--brand', 'red',
      '--token', 'test-token'
    ], { cwd: testProjectDir });

    // Verify all files created
    expect(await fs.pathExists(path.join(testProjectDir, 'kigumi-components.json'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, '.env'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, 'src/lib/webawesome.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(testProjectDir, 'src/styles/theme.css'))).toBe(true);

    // Verify config correct
    const config = await fs.readJson(path.join(testProjectDir, 'kigumi-components.json'));
    expect(config.theme.brandColor).toBe('red');  // ✅ Must be red, not blue!

    // 2. Install dependencies
    await execCommand(['install'], { cwd: testProjectDir });

    // 3. Add components
    await execCommand(['add', 'button', 'input', 'card'], { cwd: testProjectDir });

    // Verify components created
    expect(await fs.pathExists(path.join(testProjectDir, 'src/components/ui/Button/Button.tsx'))).toBe(true);

    // 4. Change theme
    await execCommand(['theme', 'glossy'], { cwd: testProjectDir });

    const updatedConfig = await fs.readJson(path.join(testProjectDir, 'kigumi-components.json'));
    expect(updatedConfig.theme.selected).toBe('glossy');
  });
});
```

---

## Implementation Order

1. **Fix Bug #2 first** (30 min) - easiest, add brand parameter
2. **Fix Bug #1 next** (2 hours) - improve error handling in file-generator
3. **Fix Bug #3 last** (2 hours) - improve config validation
4. **Add E2E test** (2 hours) - prevent regressions
5. **Manual test full workflow** (1 hour) - verify in browser

**Total**: ~7-8 hours

---

## Success Criteria

✅ Init command completes without errors
✅ All files generated (webawesome.ts, theme.css, .env, vite-env.d.ts)
✅ Brand color parameter respected
✅ Install command succeeds
✅ Add command works
✅ Theme switching works
✅ App runs in browser with correct theme
✅ E2E test passes

---

## Post-Fix Verification

1. Run full E2E test
2. Create new React project from scratch
3. Run: `kigumi init --framework react --tier pro --theme brutalist --brand red`
4. Verify all files created
5. Run: `kigumi install`
6. Run: `kigumi add button input card dialog`
7. Run: `npm run dev`
8. Open browser, verify components work
9. Run: `kigumi theme glossy`
10. Reload browser, verify theme changed

If ALL steps work → CLI is production ready
If ANY step fails → more bugs to fix
