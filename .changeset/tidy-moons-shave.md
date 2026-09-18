---
'kigumi': patch
---

Fix a latent naming bug: PascalCase component names with consecutive capitals
resolved to the wrong kebab-case key.

Four call sites hand-rolled the PascalCase to kebab-case conversion and omitted
the consecutive-capitals rule that `toKebabCase` in `src/utils/naming.ts`
already had. A component named `QRCode` resolved to `qrcode` instead of
`qr-code`, missing its CSS metadata entry and silently emitting a stylesheet
with no CSS parts and a broken documentation URL.

All four now call the shared `toKebabCase`. `naming.ts` also gains the inverse
direction (`toPascalCase`, `toCamelCase`, `stripWaPrefix`), so the six scripts
that hand-rolled kebab-to-Pascal share one primitive. The per-framework handler
name adapters keep their distinct outputs, including Angular's `input` to
`inputEvent` collision rule.

No generated output changes.
