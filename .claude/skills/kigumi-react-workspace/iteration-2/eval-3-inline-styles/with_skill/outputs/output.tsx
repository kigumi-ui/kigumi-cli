import { Input, Switch, Textarea } from '@/components/ui';

export default function ProfileForm() {
  return (
    <form style={{ maxWidth: '60ch', margin: 'auto' }}>
      <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
        <Input label="First name" required />
        <Input label="Last name" required />
      </div>
      <Textarea label="Bio" rows={4} style={{ marginTop: '1rem' }} />
      <Switch checked>Enable notifications</Switch>
    </form>
  );
}
