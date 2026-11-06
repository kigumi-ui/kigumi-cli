---
'kigumi': minor
---

### Deprecated

- **Props Web Awesome does not declare**: 16 props never had an effect, because the Web Awesome element has no such attribute. They are deprecated and will be removed in the next major. Run `kigumi update` to see them struck through in your editor, each with what to do instead:
  - **ColorPicker**: `inline`
  - **Dropdown**: `disabled`, `stay-open-on-select`, `hoist`
  - **DropdownItem**: `loading`
  - **MutationObserver**: `subtree`
  - **Popover**: `disabled`, `trigger`, `with-arrow`
  - **Popup**: `strategy`
  - **RadioGroup**: `invalid`, `help-text`
  - **Scroller**: `with-scroll-indicator`
  - **Select**: `hoist`, `invalid`, `help-text`

  Use `hint` instead of `help-text`. The Popover arrow shows by default (`without-arrow` hides it), and so do the Scroller shadows (`without-shadow` hides them). Dropdown and Select panels render in the top layer, so they need no `hoist` to escape a clipping container.
