# FileInput

**Web Awesome**: `wa-file-input`  
**Kigumi React**: `<FileInput>`  
**Category**: Form Controls  
**Tier**: pro

React wrapper component for the Web Awesome `wa-file-input` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-file-input label="value" hint="value">Click me</wa-file-input>
```

```tsx
// Kigumi React
import { FileInput } from '@/components/ui';

<FileInput label="value" hint="value">
  Click me
</FileInput>;
```

## Props

| Prop       | Type    | Values                         | Default  | Description                                    |
| ---------- | ------- | ------------------------------ | -------- | ---------------------------------------------- |
| `label`    | string  | -                              | `-`      | Accessible label for the input                 |
| `hint`     | string  | -                              | `-`      | Descriptive hint text                          |
| `accept`   | string  | -                              | `-`      | Accepted file types (MIME types or extensions) |
| `multiple` | boolean | -                              | `false`  | Allow multiple file selection                  |
| `disabled` | boolean | -                              | `false`  | Disables the input                             |
| `required` | boolean | -                              | `false`  | Makes field mandatory                          |
| `size`     | string  | 'small' \| 'medium' \| 'large' | `medium` | Input size                                     |

## Slots

| Slot        | Description                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `label`     | The file input's label. Alternatively, you can use the `label` attribute.                       |
| `hint`      | Text that describes how to use the file input. Alternatively, you can use the `hint` attribute. |
| `dropzone`  | Custom content to show in the dropzone.                                                         |
| `file-icon` | Custom icon for non-image files.                                                                |

## Events

| Event        | React Handler | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `input`      | `onInput`     | `InputEvent`  | Emitted when file selection changes.                                                              |
| `change`     | `onChange`    | `Event`       | Emitted when files are added or removed.                                                          |
| `focus`      | `onFocus`     | `FocusEvent`  | Emitted when the dropzone gains focus.                                                            |
| `blur`       | `onBlur`      | `FocusEvent`  | Emitted when the dropzone loses focus.                                                            |
| `wa-invalid` | `onWaInvalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part             | Description                              |
| ---------------- | ---------------------------------------- |
| `label`          | The label element.                       |
| `hint`           | The hint element.                        |
| `base`           | The main component wrapper.              |
| `dropzone`       | The drag-and-drop area.                  |
| `dropzone-icon`  | The upload icon in the dropzone.         |
| `dropzone-text`  | The instruction text in the dropzone.    |
| `file-list`      | The container for selected files.        |
| `file`           | Individual file item container.          |
| `file-thumbnail` | The thumbnail/icon container for a file. |
| `file-image`     | The image element for image thumbnails.  |
| `file-icon`      | The icon for non-image files.            |
| `file-details`   | Container for file name and size.        |
| `file-name`      | The file name text.                      |
| `file-size`      | The file size text.                      |
| `remove-button`  | The remove button for each file.         |

## Methods

| Method    | Parameters              | Description                        |
| --------- | ----------------------- | ---------------------------------- |
| `focus()` | `options: FocusOptions` | Sets focus on the file input.      |
| `blur()`  | -                       | Removes focus from the file input. |

## Installation

```bash
npx kigumi add file-input
```

---

**Documentation**: [webawesome.com/docs/components/file-input](https://webawesome.com/docs/components/file-input)
