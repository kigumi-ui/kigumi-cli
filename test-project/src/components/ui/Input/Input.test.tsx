import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input label="Test Input" />);
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Input className="custom-class" label="Test" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with type', () => {
    const { container } = render(
      <Input type="email" label="Email" />
    );
    const input = container.querySelector('wa-input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with hint text', () => {
    render(<Input label="Test" hint="Help text" />);
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });
});
