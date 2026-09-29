---
'kigumi': minor
---

### Added

- **Slider**: Expose `min-value` and `max-value`, so a `range` slider can start its two thumbs where you want them, plus `indicator-offset` (the value the filled track starts from), `tooltip-placement` and `tooltip-distance`. Run `kigumi update` to pick up new props in installed components.
- **QrCode**: Expose `image`, `image-background` and `image-coverage`, for a logo in the centre of the code.
- **Popup**: Expose `boundary` (`viewport` | `scroll`), the area flip, shift and auto-size keep the popup inside, and `hover-bridge`, which lets the pointer cross the gap between anchor and popup.
- **CopyButton**: Expose `tooltip` (`full` | `copy` | `none`), to show the tooltip only after copying, or never.
- **NumberInput**: Expose `pill`, matching Input and TimeInput.
- **TimeInput**: Expose `distance`, the gap between the input and its dropdown.
- **IntersectionObserver**: Expose `root`, the ID of the element whose bounds count as the viewport.
- **Rating**: Expose `default-value`, the value a form reset restores.
