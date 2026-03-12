# Shadow Components (35 components, 6 categories)

Presets can specify which components receive `box-shadow` via the `shadowComponents` array. Values are PascalCase class names:

| Category               | Components                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Actions** (6)        | Button, ButtonGroup, Dropdown, Menu, MenuItem, MenuLabel                                           |
| **Feedback** (6)       | Alert, Badge, Callout, Tag, Toast, Tooltip                                                         |
| **Form Controls** (10) | Checkbox, Combobox, DatePicker, FileInput, Input, Radio, RadioGroup, Select, Switch, Textarea      |
| **Imagery** (3)        | Avatar, Carousel, ImageComparer                                                                    |
| **Organization** (11)  | Breadcrumb, BreadcrumbItem, Card, Details, Dialog, Drawer, Tab, TabGroup, TabPanel, Tree, TreeItem |
| **Utilities** (2)      | Popover, Popup                                                                                     |

**Usage in JSON:** `"shadowComponents": ["Card", "Button", "Alert"]`
