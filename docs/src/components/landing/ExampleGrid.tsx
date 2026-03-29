import { ActionPanelExample } from './examples/ActionPanelExample';
import { ActivityLogExample } from './examples/ActivityLogExample';
import { CommentsExample } from './examples/CommentsExample';
import { DataDisplayExample } from './examples/DataDisplayExample';
import { PaginationButtonGroupExample } from './examples/PaginationButtonGroupExample';
import { ContactExample } from './examples/ContactExample';

export function ExampleGrid() {
  return (
    <section className="example-grid section">
      <div className="example-header wa-stack wa-gap-xs">
        <h2 className="wa-heading-2xl">Build any interface</h2>
        <p className="wa-color-text-quiet">
          Layouts, forms, data views and more. Composable patterns for real
          applications
        </p>
      </div>

      <div>
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
    </section>
  );
}
