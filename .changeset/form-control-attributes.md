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
  - `spellcheck`: `Input`, `TagInput`
  - `autocorrect`: `TagInput`, `Textarea`

### Fixed

- **Input, Textarea, Combobox**: `autocorrect={false}` (`Input`, `Combobox`) and `spellcheck={false}` (`Textarea`, `Combobox`) now turn autocorrect and spell checking off. Web Awesome reads these two attributes by value (`"true"`/`"false"`, `"on"`/`"off"`), not by presence. Vue and Angular dropped a `false` value, so `spellcheck` stayed on. React wrote `autocorrect={false}` as `"false"`, which Web Awesome reads as on (React 18), and `autocorrect` as a bare attribute, which it reads as off (React 19). All three frameworks now write the keyword, and leave the attribute off only when the prop is unset. Run `kigumi update` to pick up the fix in installed components.
