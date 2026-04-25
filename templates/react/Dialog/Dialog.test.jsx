import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders without crashing', () => {
    render(<Dialog label="Test Dialog">Dialog content</Dialog>);
    const dialog = screen.getByText('Dialog content');
    expect(dialog).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Dialog label="Test" className="custom-class">
        Test
      </Dialog>
    );
    const dialog = container.querySelector('wa-dialog');
    expect(dialog?.className).toContain('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef();
    render(
      <Dialog ref={ref} label="Test">
        Test
      </Dialog>
    );
    expect(ref.current).toHaveProperty('show');
    expect(ref.current).toHaveProperty('hide');
    expect(ref.current).toHaveProperty('requestClose');
  });
});
