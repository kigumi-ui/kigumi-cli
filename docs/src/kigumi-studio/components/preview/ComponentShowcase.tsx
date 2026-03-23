import clsx from 'clsx';
import { useStudio } from '../../contexts/StudioContext';
import './ComponentShowcase.css';
import '../../themes/wa-default-override.css';
import { ActionPanelExample } from '@/components/landing/examples/ActionPanelExample';
import { ActivityLogExample } from '@/components/landing/examples/ActivityLogExample';
import { CommentsExample } from '@/components/landing/examples/CommentsExample';
import { ContactExample } from '@/components/landing/examples/ContactExample';
import { DataDisplayExample } from '@/components/landing/examples/DataDisplayExample';
import { PaginationButtonGroupExample } from '@/components/landing/examples/PaginationButtonGroupExample';

export function ComponentShowcase() {
  const { getStyleObject, previewMode } = useStudio();
  const styleObj = getStyleObject(previewMode);

  // Add color-scheme to the style object so browsers render form controls correctly
  const fullStyle: React.CSSProperties = {
    ...(styleObj as React.CSSProperties),
    colorScheme: previewMode,
  };

  return (
    <div
      className={clsx('component-showcase', {
        'wa-dark': previewMode === 'dark',
        'wa-light': previewMode === 'light',
      })}
      style={fullStyle}
    >
      <div className="example-masonry">
        <div className="example-masonry-item">
          <ActionPanelExample />
        </div>
        <div className="example-masonry-item">
          <ActivityLogExample />
        </div>
        <div className="example-masonry-item">
          <CommentsExample />
        </div>
        <div className="example-masonry-item">
          <DataDisplayExample />
        </div>
        <div className="example-masonry-item">
          <PaginationButtonGroupExample />
        </div>
        <div className="example-masonry-item">
          <ContactExample />
        </div>
      </div>
    </div>
  );
}
