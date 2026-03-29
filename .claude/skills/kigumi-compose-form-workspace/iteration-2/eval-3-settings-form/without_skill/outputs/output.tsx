import { useState } from 'react';
import { Button, Card, Divider, Input, Switch, Textarea } from '@/components/ui';

// Inline type declarations for wa-select and wa-option (not yet wrapped in this project)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-select': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          hint?: string;
          value?: string;
          name?: string;
          size?: 'small' | 'medium' | 'large';
          appearance?: 'filled' | 'outlined' | 'filled-outlined';
          disabled?: boolean;
          required?: boolean;
          placeholder?: string;
        },
        HTMLElement
      >;
      'wa-option': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          class?: string;
          value?: string;
          disabled?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';

export function SettingsForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState('weekly');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="wa-stack wa-align-items-center" style={{ padding: 'var(--wa-spacing-xl)' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <form className="wa-stack wa-gap-l" onSubmit={handleSubmit}>

          {/* Profile section */}
          <Card appearance="outlined">
            <div className="wa-stack wa-gap-m" slot="header">
              <h2 className="wa-heading-s" style={{ margin: 0 }}>Profile</h2>
            </div>

            <div className="wa-stack wa-gap-m">
              <div className="wa-cluster wa-gap-m" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="First name"
                    name="firstName"
                    type="text"
                    value={firstName}
                    onInput={(e) => setFirstName((e.target as HTMLInputElement).value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Last name"
                    name="lastName"
                    type="text"
                    value={lastName}
                    onInput={(e) => setLastName((e.target as HTMLInputElement).value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <Textarea
                label="Bio"
                name="bio"
                placeholder="Tell us a bit about yourself..."
                value={bio}
                rows={4}
                resize="vertical"
                onInput={(e) => setBio((e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%' }}
              />
            </div>
          </Card>

          {/* Notifications section */}
          <Card appearance="outlined">
            <div className="wa-stack wa-gap-m" slot="header">
              <h2 className="wa-heading-s" style={{ margin: 0 }}>Notifications</h2>
            </div>

            <div className="wa-stack wa-gap-m">
              <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
                <div className="wa-stack wa-gap-3xs">
                  <span className="wa-body-s">Email notifications</span>
                  <span className="wa-caption-s" style={{ color: 'var(--wa-color-neutral-60)' }}>
                    Receive updates and alerts via email
                  </span>
                </div>
                <Switch
                  name="emailNotifications"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications((prev) => !prev)}
                />
              </div>

              <Divider />

              <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
                <div className="wa-stack wa-gap-3xs">
                  <span className="wa-body-s">SMS notifications</span>
                  <span className="wa-caption-s" style={{ color: 'var(--wa-color-neutral-60)' }}>
                    Receive updates and alerts via text message
                  </span>
                </div>
                <Switch
                  name="smsNotifications"
                  checked={smsNotifications}
                  onChange={() => setSmsNotifications((prev) => !prev)}
                />
              </div>

              <Divider />

              <wa-select
                label="Notification frequency"
                name="notificationFrequency"
                value={notificationFrequency}
                onChange={(e: Event) => {
                  const target = e.target as HTMLElement & { value: string };
                  setNotificationFrequency(target.value);
                }}
              >
                <wa-option value="daily">Daily</wa-option>
                <wa-option value="weekly">Weekly</wa-option>
                <wa-option value="monthly">Monthly</wa-option>
              </wa-select>
            </div>
          </Card>

          <div className="wa-cluster wa-justify-content-flex-end">
            <Button type="submit" variant="brand" size="medium">
              Save settings
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
