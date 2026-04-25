import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/chart/chart.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/chart/chart.js'));
}

/**
 * Renders interactive data visualisations including bars, lines, pies, and more via Chart.js
 *
 * @see https://webawesome.com/docs/components/chart
 */
@Component({
  selector: 'k-chart',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-chart
        #element
        [attr.label]="label"
        [attr.description]="description"
        [attr.type]="type"
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
        [attr.without-tooltip]="withoutTooltip || null">
      <ng-content />
    </wa-chart>
  `,
  styleUrl: './chart.component.css',
})
export class ChartComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Accessible name read by screen readers */
  @Input() label?: string;
  /** Supplementary accessible description for the chart */
  @Input() description?: string;
  /** Visualisation style to use for the datasets */
  @Input() type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'scatter' | 'bubble';
  /** Text label shown along the horizontal axis */
  @Input() xLabel?: string;
  /** Text label shown along the vertical axis */
  @Input() yLabel?: string;
  /** Where the dataset legend appears around the chart area */
  @Input() legendPosition?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
  /** Layers multiple datasets on a single axis */
  @Input() stacked?: boolean;
  /** Primary axis for categories (swap to create horizontal charts) */
  @Input() indexAxis?: 'x' | 'y';
  /** Controls which background grid lines are visible */
  @Input() grid?: 'x' | 'y' | 'both' | 'none';
  /** Lower bound for the value axis scale */
  @Input() min?: number;
  /** Upper bound for the value axis scale */
  @Input() max?: number;
  /** Turns off entrance and update transitions */
  @Input() withoutAnimation?: boolean;
  /** Removes the dataset legend from view */
  @Input() withoutLegend?: boolean;
  /** Suppresses hover tooltips on data points */
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
