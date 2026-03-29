import { Button, Card, Icon, Input } from '@/components/ui';

export function SettingsCard() {
  return (
    <Card>
      <div slot="header">
        <Icon name="gear" />
        Settings
      </div>
      <Input label="Username" value="mischa" class="wa-mb-m" />
      <Button variant="brand" loading>
        Save Changes
      </Button>
    </Card>
  );
}
