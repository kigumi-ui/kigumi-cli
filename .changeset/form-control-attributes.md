---
'kigumi': minor
---

### Added

- **Form controls**: new typed props for native-style attributes that Web Awesome already supports, in React, Vue and Angular. Run `kigumi update` to pick them up in installed components.
  - `custom-error` (Angular `customError`), a custom validation message that keeps the control invalid while it is set: `Button`, `Checkbox`, `ColorPicker`, `Combobox`, `DateInput`, `FileInput`, `Input`, `KnownDate`, `NumberInput`, `OtpInput`, `Radio`, `RadioGroup`, `Rating`, `Select`, `Slider`, `Switch`, `TagInput`, `Textarea`, `TimeInput`
  - `title`: `Button`, `Checkbox`, `Input`, `NumberInput`, `Switch`, `Textarea`
  - `name`: `FileInput`, `NumberInput`, `Radio`
  - `readonly`: `NumberInput`
  - `autocomplete`: `KnownDate`, `NumberInput`, `TagInput`, `Textarea`, `TimeInput`
  - `autofocus`: `NumberInput`, `OtpInput`, `Textarea`
  - `autocapitalize`, `inputmode`: `TagInput`, `Textarea` (`inputmode` on `NumberInput` too, limited to `numeric` and `decimal`)
  - `enterkeyhint`: `NumberInput`, `TagInput`, `Textarea`
