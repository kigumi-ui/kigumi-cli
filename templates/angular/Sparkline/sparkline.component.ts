import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/sparkline/sparkline.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/sparkline/sparkline.js'));
}

/**
 * Sparklines are small inline data visualizations for showing trends
 *
 * @see https://webawesome.com/docs/components/sparkline
 */
@Component({
  selector: 'k-sparkline',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-sparkline
      #element
      [attr.data]="data"
      [attr.label]="label"
      [attr.appearance]="appearance"
      [attr.trend]="trend"
      [attr.curve]="curve"
    >
      <ng-content />
    </wa-sparkline>
  `,
  styleUrl: './sparkline.component.css',
})
export class SparklineComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Space-separated numeric data points */
  @Input() data?: string;
  /** An accessible label for assistive devices */
  @Input() label?: string;
  /** Visual style of the sparkline */
  @Input() appearance?: 'gradient' | 'line' | 'solid';
  /** Trend direction, used for coloring */
  @Input() trend?: 'positive' | 'negative' | 'neutral';
  /** Interpolation curve style */
  @Input() curve?: 'linear' | 'natural' | 'step';

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
