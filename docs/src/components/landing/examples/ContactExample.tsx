import { Button, Card, Input, Switch, Textarea } from '@/components/ui';

export function ContactExample() {
  return (
    <Card>
      <div className="wa-stack">
        <div className="wa-stack wa-gap-xs">
          <h2 className="wa-heading-xl">Contact Us</h2>
          <p className="wa-caption-m">We'd love to hear from you.</p>
        </div>
        <form className="wa-stack wa-gap-l">
          <div className="wa-grid">
            <Input label="First name" />
            <Input label="Last name" />
          </div>
          <Input label="Email" type="email" />
          <Input label="Phone Number" type="tel" />
          <Textarea label="What's on your mind?" />
          <Switch>
            I agree to the <a href="#">privacy policy</a>.
          </Switch>
          <Button>Submit</Button>
        </form>
      </div>
    </Card>
  );
}
