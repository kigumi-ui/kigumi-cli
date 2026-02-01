import {
  Button,
  Checkbox,
  Divider,
  FormatDate,
  Rating,
  Textarea,
} from '@/components/ui';
import { Card } from '@/components/ui';

export function CommentsExample() {
  return (
    <Card {...{ 'with-header': true, 'with-footer': true }}>
      <div slot="header">
        <h3 className="wa-heading-m">I watched...</h3>
      </div>
      <div className="wa-stack">
        <div
          className="wa-flank"
          style={{ '--flank-size': '3rem' } as React.CSSProperties}
        >
          <div className="wa-frame:portrait wa-border-radius-s">
            <img
              src="https://images.unsplash.com/photo-1607675742178-f616ae75044b?q=80&w=3435&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="the cover image for the film"
            />
          </div>
          <span className="wa-heading-xl">Heretic</span>
        </div>
        <Divider />
        <dl className="wa-split">
          <dt>Date</dt>
          <dd>
            <FormatDate
              date="2025-03-13T00:00:00.000-04:00"
              weekday="long"
              month="long"
              day="numeric"
              year="numeric"
              className="wa-caption-s"
            />
          </dd>
        </dl>
        <Divider />
        <div className="wa-split">
          <Rating label="Rating" />
          <Checkbox>Loved it!</Checkbox>
        </div>
        <Divider />
        <Textarea placeholder="Add review..." aria-label="Add review" />
      </div>
      <div slot="footer" className="wa-grid">
        <Button appearance="outlined">Cancel</Button>
        <Button variant="brand">Save</Button>
      </div>
    </Card>
  );
}
