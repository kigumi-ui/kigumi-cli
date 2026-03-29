import { Input, Switch, Textarea } from '@/components/ui';
import './ProfileForm.css';

export function ProfileForm() {
  return (
    <form className="ProfileForm">
      <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
        <Input label="First name" required />
        <Input label="Last name" required />
      </div>
      <Textarea label="Bio" rows={4} style={{ marginTop: '1rem' }} />
      <Switch checked>Enable notifications</Switch>
    </form>
  );
}
