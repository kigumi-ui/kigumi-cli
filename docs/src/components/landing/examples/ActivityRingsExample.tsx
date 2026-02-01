import { Card } from '@/components/ui/Card/Card';
import { ProgressRing } from '@/components/ui/ProgressRing/ProgressRing';

export function ActivityRingsExample() {
  return (
    <Card appearance="outlined" className="wa-dark">
      <div className="wa-cluster wa-gap-xl wa-align-items-center">
        <div
          style={{
            position: 'relative',
            width: '176px',
            height: '176px',
            flexShrink: 0,
          }}
        >
          {/* Inner ring - Parenting */}
          <ProgressRing
            value={75}
            style={
              {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                '--size': '100px',
                '--track-width': '16px',
                '--indicator-width': '16px',
                '--track-color':
                  'color-mix(in oklab, crimson 20%, transparent)',
                '--indicator-color': 'crimson',
              } as React.CSSProperties
            }
          />
          {/* Middle ring - Dishes */}
          <ProgressRing
            value={52}
            style={
              {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                '--size': '138px',
                '--track-width': '16px',
                '--indicator-width': '16px',
                '--track-color':
                  'color-mix(in oklab, deepskyblue 20%, transparent)',
                '--indicator-color': 'deepskyblue',
              } as React.CSSProperties
            }
          />
          {/* Outer ring - Laundry */}
          <ProgressRing
            value={25}
            style={
              {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                '--size': '176px',
                '--track-width': '16px',
                '--indicator-width': '16px',
                '--track-color':
                  'color-mix(in oklab, limegreen 20%, transparent)',
                '--indicator-color': 'limegreen',
              } as React.CSSProperties
            }
          />
        </div>
        <div className="wa-stack wa-gap-s">
          <div className="wa-stack wa-gap-2xs">
            <h3 className="wa-heading-s" style={{ margin: 0 }}>
              Parenting
            </h3>
            <p className="wa-body-s" style={{ color: 'crimson', margin: 0 }}>
              18/24 hrs
            </p>
          </div>
          <div className="wa-stack wa-gap-2xs">
            <h3 className="wa-heading-s" style={{ margin: 0 }}>
              Dishes
            </h3>
            <p
              className="wa-body-s"
              style={{ color: 'deepskyblue', margin: 0 }}
            >
              52/100 plates
            </p>
          </div>
          <div className="wa-stack wa-gap-2xs">
            <h3 className="wa-heading-s" style={{ margin: 0 }}>
              Laundry
            </h3>
            <p className="wa-body-s" style={{ color: 'limegreen', margin: 0 }}>
              1/4 loads
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
