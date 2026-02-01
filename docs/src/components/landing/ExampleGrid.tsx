import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';
import { CommentsExample } from './examples/CommentsExample';
import { ActionPanelExample } from './examples/ActionPanelExample';
import { ActivityLogExample } from './examples/ActivityLogExample';
import { DataDisplayExample } from './examples/DataDisplayExample';
import { PaginationButtonGroupExample } from './examples/PaginationButtonGroupExample';
import { ContactExample } from './examples/ContactExample';

export function ExampleGrid() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <section id="examples" className="example-section">
      <div className="example-container">
        <div className="wa-split:row wa-align-items-center example-header">
          <h2 className="wa-heading-2xl">See What's Possible</h2>
          <Button
            appearance="outlined"
            size="small"
            onClick={() => setDarkMode(!darkMode)}
          >
            <Icon name={darkMode ? 'sun' : 'moon'} />
            {darkMode ? 'Light' : 'Dark'} Mode
          </Button>
        </div>

        <div className={`ui-component-examples ${darkMode ? 'wa-dark' : ''}`}>
          <ActionPanelExample />
          <ActivityLogExample />
          <CommentsExample />
          <DataDisplayExample />
          <PaginationButtonGroupExample />
          <ContactExample />
        </div>
      </div>
    </section>
  );
}
