import { Button, Card, Icon, Input } from '@/components/ui';

export default function SettingsCard() {
  return (
    <Card>
      <div slot="header">
        <Icon name="gear" />
        Settings
      </div>
      <Input label="Username" value="mischa" className="wa-mb-m" />
      <Button variant="brand" loading>Save Changes</Button>
    </Card>
  );
}
