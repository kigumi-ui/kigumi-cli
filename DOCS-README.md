# Documentation Guide

**For agents working on Kigumi CLI**

## 📖 Read This First

Start here to understand the project:

1. **PROJECT-STATUS.md** (5 min read)
   - What works, what doesn't
   - Current implementation state
   - Success criteria for MVP
   - **READ FIRST**

2. **THEME-SYSTEM.md** (10 min read)
   - How Web Awesome themes actually work
   - Why HTML classes are required
   - Design tokens reference
   - **REQUIRED for theme tasks**

3. **TODO.md** (3 min read)
   - Prioritized action items
   - Phase 1 & 2 tasks
   - Definition of done
   - **Work from this list**

## 📚 Reference Documents

Use these when needed:

- **TECH-DEBT.md** - Summary of known issues (quick reference)
- **IMPLEMENTATION-PLAN.md** - Detailed step-by-step for Phase 1 & 2 (optional)

## 🗂️ Documentation Structure

```
📄 PROJECT-STATUS.md    ← Start here (current state)
📚 THEME-SYSTEM.md      ← How themes work (must read for theme tasks)
📋 TODO.md              ← What to do (action items)
📊 TECH-DEBT.md         ← Known issues (summary)
📝 IMPLEMENTATION-PLAN.md ← Detailed tasks (optional)
📖 DOCS-README.md       ← This file (documentation guide)
```

## 🚦 Quick Start for Agents

**If you're fixing the theme system:**
1. Read PROJECT-STATUS.md → understand current state
2. Read THEME-SYSTEM.md → understand how themes work
3. Follow TODO.md Phase 1 → implement fixes
4. Test with test-project → verify in browser

**If you're adding theme commands:**
1. Read PROJECT-STATUS.md → understand current state
2. Read THEME-SYSTEM.md → understand theme concepts
3. Follow TODO.md Phase 2 → implement commands
4. Test each command → verify updates work

**If you're working on something else:**
1. Read PROJECT-STATUS.md → understand what's done
2. Read relevant sections of THEME-SYSTEM.md
3. Check TODO.md → see if it's already listed
4. Check TECH-DEBT.md → see if it's known tech debt

## ❗ Critical Context

**The main issue:**
- Web Awesome themes are imported but NOT activated
- Missing: HTML classes on `<html>` element
- Result: Themes don't work at all

**Why this matters:**
- Web Awesome requires BOTH CSS import AND HTML classes
- CSS import alone does nothing
- This is fundamental to how Web Awesome works

**See THEME-SYSTEM.md for full explanation**

## 🧪 Testing

After making changes:
```bash
# Build CLI
npm run build

# Test in test-project
cd test-project
npm run dev

# Open browser and inspect:
# 1. <html> element has three classes
# 2. Components render correctly
# 3. Theme visually applies
# 4. No console errors
```

## 📁 Key Files

**CLI Source:**
- `src/commands/init.ts` - Project initialization
- `src/commands/add.ts` - Component generation
- `src/utils/config.ts` - Config schema
- `src/utils/template.ts` - Template generation
- `src/utils/registry.ts` - Component registry

**Test Project:**
- `test-project/src/lib/webawesome.ts` - Theme setup (NEEDS FIX)
- `test-project/kigumi-components.json` - Config (UNUSED)
- `test-project/src/types/web-awesome.d.ts` - TypeScript declarations

## 🎯 Goals

**Phase 1:** Fix theme system (CRITICAL)
**Phase 2:** Add theme commands (HIGH)
**Phase 3:** Documentation (MEDIUM)
**Phase 4:** Additional features (LOW)

**Current priority:** Phase 1

## 💡 Tips for Agents

1. **Don't assume themes work** - They don't (yet)
2. **Always test in browser** - TypeScript errors are OK if runtime works
3. **One task at a time** - Don't batch unrelated changes
4. **Read THEME-SYSTEM.md** - It explains the "why" behind fixes
5. **Use test-project** - Don't create new test projects

## 🔍 Common Questions

**Q: Why aren't themes working?**
A: HTML classes aren't set. Read THEME-SYSTEM.md.

**Q: What should I work on?**
A: Follow TODO.md from the top.

**Q: Where do I test?**
A: In `test-project` directory.

**Q: Can I skip THEME-SYSTEM.md?**
A: No. It's required reading for understanding the fixes.

**Q: Is IMPLEMENTATION-PLAN.md required?**
A: No. TODO.md has the essentials. IMPLEMENTATION-PLAN has more detail if needed.

## 📊 Progress Tracking

Check TODO.md for current status:
- Phase 1 Status
- Phase 2 Status
- MVP Completion %

## 🚨 Before You Start

✅ Read PROJECT-STATUS.md
✅ Read THEME-SYSTEM.md (if working on themes)
✅ Check TODO.md for next task
✅ Understand the test process

Then start coding!
