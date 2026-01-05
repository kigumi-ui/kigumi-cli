import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Button className="custom-class">Test</Button>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with variant', () => {
    const { container } = render(
      <Button variant="brand">Brand Button</Button>
    );
    const button = container.querySelector('wa-button');
    expect(button).toHaveAttribute('variant', 'brand');
  });

  it('renders disabled state', () => {
    const { container } = render(
      <Button disabled>Disabled</Button>
    );
    const button = container.querySelector('wa-button');
    expect(button).toHaveAttribute('disabled');
  });
});
