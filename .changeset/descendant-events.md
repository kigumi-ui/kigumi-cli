---
'kigumi': patch
---

### Fixed

- **Events**: A component no longer reports an event that bubbled up from a component inside it. Closing a Dropdown, Select or Tooltip inside a Dialog or Drawer used to fire the Dialog's hide event, so the usual `onHide={() => setOpen(false)}` closed the Dialog, and in Vue the Dialog closed on its own. The same happened to a TreeItem or Accordion with nested items, whose expand and collapse events reached the outer one. Every wrapper in React, Vue and Angular now forwards only the events its own Web Awesome element fires. Run `kigumi update` to pick it up in installed components.
