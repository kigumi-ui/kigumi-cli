---
"kigumi": patch
---

Fix React 19 ref-typing errors in all 75 React templates by switching to a callback-ref pattern with WaXxx class type imports. Pro shim hardened from unknown stubs to accurate class declarations with method signatures (combobox, toast, file-input, number-input). Side-effect corrections: removed private show/requestClose methods from Dialog/Drawer ref interface (use the open attribute instead) and static getMarked/updateAll from Markdown ref interface. (F-072)
