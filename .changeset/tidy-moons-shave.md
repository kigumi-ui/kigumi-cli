---
'kigumi': patch
---

### Fixed

- **Naming**: PascalCase component names with consecutive capitals resolved to the wrong kebab-case key. Four call sites hand-rolled the PascalCase-to-kebab conversion and omitted the consecutive-capitals rule that `toKebabCase` already had, so a component named `QRCode` resolved to `qrcode` instead of `qr-code`, missing its CSS metadata entry and silently emitting a stylesheet with no CSS parts and a broken documentation URL. All four now call the shared `toKebabCase`.

### Added

- **Naming**: `toPascalCase`, `toCamelCase` and `stripWaPrefix` in `src/utils/naming.ts`, so the six scripts that hand-rolled the kebab-to-Pascal direction share one primitive. The per-framework handler-name adapters keep their distinct outputs, including Angular's `input` to `inputEvent` collision rule. No generated output changes.
