import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/bubble-chart/bubble-chart.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/bubble-chart/bubble-chart.js'));
}

/**
 * Plots three-dimensional data using position and circle size to encode a third variable
 *
 * @see https://webawesome.com/docs/components/bubble-chart
 */
@Component({
  selector: 'k-bubble-chart',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-bubble-chart
      #element
      [attr.label]="label"
      [attr.description]="description"
      [attr.x-label]="xLabel"
      [attr.y-label]="yLabel"
      [attr.legend-position]="legendPosition"
      [attr.stacked]="stacked || null"
      [attr.index-axis]="indexAxis"
      [attr.grid]="grid"
      [attr.min]="min"
      [attr.max]="max"
      [attr.without-animation]="withoutAnimation || null"
      [attr.without-legend]="withoutLegend || null"
      [attr.without-tooltip]="withoutTooltip || null"
    >
      <ng-content />
    </wa-bubble-chart>
  `,
  styleUrl: './bubble-chart.component.css',
})
export class BubbleChartComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Accessible name announced by assistive technology */
  @Input() label?: string;
  /** Extended accessible description for the chart */
  @Input() description?: string;
  /** Caption displayed beneath the horizontal axis */
  @Input() xLabel?: string;
  /** Caption displayed beside the vertical axis */
  @Input() yLabel?: string;
  /** Placement of the dataset legend relative to the chart */
  @Input() legendPosition?:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'start'
    | 'end';
  /** Layers multiple datasets on a single axis */
  @Input() stacked?: boolean;
  /** Base axis for category labels (swap to flip chart orientation) */
  @Input() indexAxis?: 'x' | 'y';
  /** Selects which background grid lines are drawn */
  @Input() grid?: 'x' | 'y' | 'both' | 'none';
  /** Floor value for the value axis scale */
  @Input() min?: number;
  /** Ceiling value for the value axis scale */
  @Input() max?: number;
  /** Disables entrance and update motion effects */
  @Input() withoutAnimation?: boolean;
  /** Hides the dataset legend entirely */
  @Input() withoutLegend?: boolean;
  /** Prevents hover tooltips from appearing on data points */
  @Input() withoutTooltip?: boolean;

  ngAfterViewInit(): void {
    ensureLoaded();
    const el = this.elementRef.nativeElement;

    // Forward host attributes to inner wa-* element
    const host = this.hostRef.nativeElement;
    const hostStyle = host.getAttribute('style');
    if (hostStyle) {
      el.setAttribute('style', hostStyle);
      host.removeAttribute('style');
    }
    // When slotted, override display:contents so ::slotted() margins apply
    if (host.hasAttribute('slot')) {
      host.style.display = 'inline';
    }
  }
}
