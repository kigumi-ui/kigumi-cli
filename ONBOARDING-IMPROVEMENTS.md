# Team Onboarding Improvements

## Problem Solved

**Scenario:** Team member clones a repo that uses Kigumi with Pro tier
- ❌ **Before:** Confusing errors, unclear next steps, wrong package manager commands
- ✅ **After:** Crystal clear onboarding with step-by-step instructions

---

## What Changed

### 1. ✅ `.env.example` File Created

**Now generated automatically for Pro tier projects:**

```env
# Web Awesome Pro Authentication Token
# Required only if you're using the Pro tier
#
# Get your token from: https://webawesome.com/pro
#
# Steps:
# 1. Sign in to your Web Awesome account
# 2. Navigate to Settings → API Tokens
# 3. Generate a new token
# 4. Copy the token and paste it below
#
# For team members: Ask your team lead for the shared Pro token
#
# Security: Never commit this file with a real token!

WA_TOKEN=your-token-here
```

**Benefits:**
- Committed to git → Team members see it immediately
- Clear instructions → No confusion about where to get token
- Team-friendly → Mentions asking team lead for shared token

---

### 2. ✅ Improved Error Messages

#### Before:
```
◇  Failed to install @awesome.me/webawesome
│
◇  Installation Error
│  Please install manually:
│  npm add @awesome.me/webawesome
```

❌ Problems:
- Shows `npm add` even if user uses pnpm/yarn
- No context about WHY it failed
- No guidance on next steps

#### After:
```
┌  Setup Required for Pro Tier
│
│  🔐 Web Awesome Pro requires authentication
│
│  This project uses Web Awesome Pro.
│
│  Next steps:
│
│  1. Get your Pro token:
│     • Sign in at https://webawesome.com
│     • Go to Settings → API Tokens
│     • Generate a new token
│     • Or ask your team lead for the shared token
│
│  2. Add token to .env:
│     WA_TOKEN=your-actual-token-here
│
│  3. Install dependencies:
│     pnpm add @awesome.me/webawesome-pro
│
│  Note: .env is gitignored for security
│
└

⚠ Set your token before continuing
```

✅ Better:
- Uses correct package manager (pnpm/yarn/npm/bun)
- Clear WHY (Pro tier needs auth)
- Step-by-step HOW (get token, add to .env, install)
- Team context (ask team lead)

---

### 3. ✅ Package Manager Detection

**Auto-detects based on lockfiles:**

| Lockfile | Package Manager | Command Shown |
|----------|----------------|---------------|
| `pnpm-lock.yaml` | pnpm | `pnpm add <package>` |
| `yarn.lock` | yarn | `yarn add <package>` |
| `bun.lockb` | bun | `bun add <package>` |
| `package-lock.json` | npm | `npm install <package>` |
| None | npm (default) | `npm install <package>` |

**Benefits:**
- No more "npm add" confusion for pnpm/yarn users
- Correct command shown in ALL error messages
- Consistent across the entire CLI

---

### 4. ✅ `.gitignore` Generation

**Auto-creates or updates `.gitignore`:**

```gitignore
# Dependencies
node_modules/

# Environment variables (contains secrets!)
.env
.env.local
.env.*.local

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

**Benefits:**
- Ensures `.env` is NEVER committed
- Protects secrets automatically
- No manual configuration needed

---

### 5. ✅ Detailed "Reinstall Only" Flow

**New option for cloned repos:**

When running `kigumi init` in existing project:
```
◆  What would you like to do?
│  ○ Update configuration
│  ● Reinstall dependencies only  ← Smart default for cloned repos
│  ○ Cancel
```

**If `.env` is missing (Pro tier):**
1. Creates `.env` from `.env.example`
2. Shows comprehensive setup guide
3. Exits gracefully with clear next steps

**Result:**
- No prompts to answer
- Clear guidance
- Fast onboarding

---

## Team Workflow Example

### Developer A (Creates Project)

```bash
# Initialize project with Pro tier
kigumi init
# Select: Pro tier, awesome theme, etc.

# Files created:
# ├─ kigumi-components.json  ← Commit to git
# ├─ .env.example            ← Commit to git
# ├─ .env                    ← DO NOT commit (gitignored)
# ├─ .gitignore              ← Commit to git
# └─ src/...

# Commit and push
git add kigumi-components.json .env.example .gitignore src/
git commit -m "Setup Kigumi with Pro tier"
git push
```

### Developer B (Clones Repo)

```bash
# Clone repo
git clone <repo>
cd <repo>

# Run kigumi init
kigumi init

# Sees:
┌  Current Configuration
│  Framework: react
│  Tier: pro
│  Theme: awesome
│  ⚠ Missing .env file for Pro tier
└

◆  What would you like to do?
│  ○ Update configuration
│  ● Reinstall dependencies only  ← Already selected!
│  ○ Cancel

# Selects "Reinstall dependencies only"

# Sees comprehensive guide:
┌  Setup Required for Pro Tier
│  [Clear step-by-step instructions]
│  1. Get token from https://webawesome.com/pro
│  2. Add to .env: WA_TOKEN=...
│  3. Run: pnpm add @awesome.me/webawesome-pro  ← Correct PM!
└

# Developer B follows steps:
# 1. Gets token or asks team lead
# 2. Adds to .env
# 3. Runs: pnpm add @awesome.me/webawesome-pro

✓ Success! Ready to develop
```

---

## Files Impacted

1. `src/commands/init.ts`
   - `.env.example` generation
   - `.gitignore` generation/update
   - Package manager detection
   - Improved error messages
   - Better "reinstall only" flow

2. `test-project/.env.example` ← Example file
3. `test-project/.gitignore` ← Example file

---

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Token guidance** | Vague URL | Step-by-step with URLs |
| **Package manager** | Always "npm add" | Detected (pnpm/yarn/npm/bun) |
| **.env.example** | ❌ Not created | ✅ Auto-created & committed |
| **.gitignore** | Manual setup | ✅ Auto-created/updated |
| **Team context** | ❌ Missing | ✅ "Ask team lead" mentioned |
| **Error messages** | Generic | Detailed with causes & fixes |
| **Cloned repo flow** | Confusing | Clear "Reinstall only" path |

---

## Result

🎯 **Perfect onboarding for:**
- New team members
- Cloned repositories
- Pro tier projects
- Any package manager (pnpm/yarn/npm/bun)

✅ **Zero confusion, maximum clarity!**
