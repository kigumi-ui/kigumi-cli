import {
  Input,
  Select,
  Option,
  Checkbox,
  Switch,
  Textarea,
  Slider,
} from '@/components/ui';

export function FormShowcase() {
  return (
    <section className="showcase-section">
      <h3 className="wa-heading-m showcase-section__title">Form Controls</h3>
      <div className="wa-stack wa-gap-m">
        <Input label="Full Name" placeholder="Enter your name" />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          hint="We will never share your email."
        />
        <Select label="Country">
          <Option value="">Select a country...</Option>
          <Option value="de">Germany</Option>
          <Option value="us">United States</Option>
          <Option value="jp">Japan</Option>
        </Select>
        <Textarea label="Message" placeholder="Type your message..." rows={3} />
        <Slider label="Volume" min={0} max={100} value={65} />
        <div className="wa-cluster wa-gap-l">
          <Checkbox>Remember me</Checkbox>
          <Switch>Notifications</Switch>
        </div>
      </div>
    </section>
  );
}
