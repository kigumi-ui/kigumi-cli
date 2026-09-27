---
'kigumi': minor
---

### Deprecated

- **QrCode**: `fill` and `background` are marked deprecated in the React, Vue and Angular wrappers, as they already are in Web Awesome. Set the CSS `color` property on the QR code for the fill, and `background-color` for the background. Run `kigumi update` to see the props struck through in your editor.

### Fixed

- **QrCode (Vue, JavaScript)**: `fill` and `background` no longer default to `black` and `white`. The defaults were always written to the element, so a CSS `color` or `background-color` on the QR code had no effect. They now default to empty, as in Web Awesome and the TypeScript Template.
