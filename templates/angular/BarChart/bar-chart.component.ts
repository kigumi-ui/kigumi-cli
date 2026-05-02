import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/bar-chart/bar-chart.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/bar-chart/bar-chart.js'));
}

/**
 * Displays categorical data as horizontal or vertical rectangular bars scaled to their values
 *
 * @see https://webawesome.com/docs/components/bar-chart
 */
@Component({
  selector: 'k-bar-chart',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-bar-chart
      #element
      [attr.label]="label"
      [attr.description]="description"
      [attr.orientation]="orientation"
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
    </wa-bar-chart>
  `,
  styleUrl: './bar-chart.component.css',
})
export class BarChartComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Accessible name announced by assistive technology */
  @Input() label?: string;
  /** Extended accessible description for the chart */
  @Input() description?: string;
  /** Controls whether bars grow upward or sideways */
  @Input() orientation?: 'vertical' | 'horizontal';
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
