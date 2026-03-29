# Settings Form

## Install required components

```bash
npx kigumi add Input Textarea Button Select Option Switch Divider Card
```

## SettingsForm.tsx

```tsx
import {
  Button,
  Card,
  Divider,
  Input,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { Option } from '@/components/ui/Option/Option';

export function SettingsForm() {
  return (
    <div className="wa-stack wa-justify-content-center wa-align-items-center">
      <Card style={{ width: '560px', marginTop: '40px' }}>
        <div className="wa-stack wa-gap-l">
          {/* Profile Section */}
          <section className="wa-stack wa-gap-m">
            <h2 className="wa-heading-s" style={{ margin: 0 }}>
              Profile
            </h2>

            <div className="wa-cluster wa-gap-m">
              <Input
                label="First name"
                name="firstName"
                placeholder="Jane"
                style={{ flex: 1 }}
              />
              <Input
                label="Last name"
                name="lastName"
                placeholder="Doe"
                style={{ flex: 1 }}
              />
            </div>

            <Textarea
              label="Bio"
              name="bio"
              placeholder="Tell us about yourself"
              rows={4}
              resize="vertical"
            />
          </section>

          <Divider />

          {/* Notifications Section */}
          <section className="wa-stack wa-gap-m">
            <h2 className="wa-heading-s" style={{ margin: 0 }}>
              Notifications
            </h2>

            <div className="wa-stack wa-gap-s">
              <Switch name="emailNotifications">Email notifications</Switch>

              <Switch name="smsNotifications">SMS notifications</Switch>
            </div>

            <Select
              label="Notification frequency"
              name="frequency"
              value="weekly"
            >
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </section>

          <Divider />

          {/* Actions */}
          <div className="wa-cluster wa-justify-content-end wa-gap-s">
            <Button appearance="outlined">Cancel</Button>
            <Button variant="brand" type="submit">
              Save changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

## SettingsForm.css

```css
/* No custom styles needed -- layout handled by WA utility classes */
```

## Notes

- **Grouped layout**: The two sections (Profile and Notifications) are visually separated by `<Divider />` components, each with its own heading and grouped fields.
- **First name / Last name** use `wa-cluster` to sit side-by-side in a row, each with `flex: 1` for equal width.
- **Bio** uses `<Textarea>` with `rows={4}` and `resize="vertical"` for multi-line input.
- **Switches** render inline labels via children, matching the Web Awesome Switch pattern.
- **Select + Option** provide the frequency dropdown with three choices; `value="weekly"` sets the default.
- **Actions row** uses `wa-cluster` with `wa-justify-content-end` to right-align Cancel and Save buttons.
- All layout uses Web Awesome utility classes (`wa-stack`, `wa-cluster`, `wa-gap-*`, `wa-heading-s`) with no custom CSS required.
- Components are imported from `@/components/ui`. If Select and Option are not yet installed, run the install command above first.
