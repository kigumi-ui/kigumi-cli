# Shadow Components (21 components, 6 categories)

Presets can specify which components receive a shadow via the `shadowComponents` array. Values are PascalCase class names. The export puts `box-shadow: var(--wa-shadow-m)` on the element that draws each component: the host (`.Card`) or a CSS part (`.Button::part(base)`), as `shadow-components.ts` records per component.

| Category              | Components                                                                        |
| --------------------- | --------------------------------------------------------------------------------- |
| **Actions** (2)       | Button, Dropdown                                                                  |
| **Feedback** (4)      | Badge, Callout, Tag, Tooltip                                                      |
| **Form Controls** (9) | Checkbox, Combobox, DatePicker, FileInput, Input, Radio, Select, Switch, Textarea |
| **Imagery** (1)       | Avatar                                                                            |
| **Organization** (4)  | Card, Details, Dialog, Drawer                                                     |
| **Utilities** (1)     | Popover                                                                           |

A name not in the list is dropped when the preset loads.

**Usage in JSON:** `"shadowComponents": ["Card", "Button", "Input"]`
