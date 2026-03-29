/**
 * Settings Form
 *
 * A settings form with two grouped sections: Profile and Notifications.
 * Uses Details components for collapsible grouped layout.
 *
 * Install required components:
 * npx kigumi add input textarea switch select option details divider button callout
 */

import { useState, type FormEvent } from 'react';
import {
  Button,
  Callout,
  Details,
  Divider,
  Input,
  Option,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';

export function SettingsForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = new FormData(e.currentTarget);
      const res = await fetch('/api/settings', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Failed to save settings');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="wa-stack wa-gap-l"
      style={{ maxWidth: '800px' }}
      onSubmit={handleSubmit}
    >
      <h1>Settings</h1>

      {error && <Callout variant="danger">{error}</Callout>}
      {success && <Callout variant="success">Settings saved successfully.</Callout>}

      {/* Profile Section */}
      <Details summary="Profile" open>
        <div className="wa-stack wa-gap-m">
          <div
            className="wa-grid"
            style={{ '--min-column-size': '200px' } as React.CSSProperties}
          >
            <Input label="First name" name="firstName" required />
            <Input label="Last name" name="lastName" required />
          </div>

          <Textarea
            label="Bio"
            name="bio"
            rows={4}
            resize="auto"
            hint="Tell us a little about yourself"
          />
        </div>
      </Details>

      {/* Notifications Section */}
      <Details summary="Notifications" open>
        <div className="wa-stack wa-gap-m">
          <Switch name="emailNotifications" checked>
            Email notifications
          </Switch>

          <Switch name="smsNotifications">
            SMS notifications
          </Switch>

          <Select label="Notification frequency" name="notificationFrequency" value="weekly">
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
          </Select>
        </div>
      </Details>

      <Divider />

      <div className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" type="reset">
          Reset
        </Button>
        <Button variant="brand" type="submit" loading={loading}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
