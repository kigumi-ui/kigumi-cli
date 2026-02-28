---
'kigumi-cli': minor
---

Add Storybook integration and extend component registry with new props

- Registry: add missing props for ColorPicker (`inline`), Combobox (`value`), Dropdown (`size`), DropdownItem (`variant`), IntersectionObserver (`intersect-class`), Popover (`for`, `without-arrow`), Radio (`appearance`), RadioGroup (`orientation`, `disabled`, `invalid`, `help-text`), Rating (`size`), Scroller (`without-scrollbar`, `without-shadow`), Select (`invalid`, `help-text`), TabGroup (`active`), Tooltip (`for`)
- Templates: clean up Dialog and Drawer (remove duplicate jsx/tsx files), fix Divider layout, improve Button and ColorPicker CSS
- Types: add web-awesome type declarations for `wa-file-input`, `wa-number-input`, `wa-sparkline`
