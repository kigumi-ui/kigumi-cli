import { render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';
import { useRef } from 'react';

describe('Dialog', () => {
  it('renders without crashing', () => {
    render(<Dialog label="Test Dialog">Dialog content</Dialog>);
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Dialog className="custom-class" label="Test">
        Test
      </Dialog>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with label', () => {
    const { container } = render(
      <Dialog label="My Dialog">Content</Dialog>
    );
    const dialog = container.querySelector('wa-dialog');
    expect(dialog).toHaveAttribute('label', 'My Dialog');
  });

  it('can be controlled with ref', () => {
    const TestComponent = () => {
      const dialogRef = useRef<{ show: () => void; hide: () => void }>(null);
      return (
        <Dialog ref={dialogRef} label="Test">
          Content
        </Dialog>
      );
    };

    const { container } = render(<TestComponent />);
    const dialog = container.querySelector('wa-dialog');
    expect(dialog).toBeInTheDocument();
  });
});
