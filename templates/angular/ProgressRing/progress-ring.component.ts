import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js'));
}

/**
 * Progress rings are used to show the completion of a task in a circular format
 *
 * @see https://webawesome.com/docs/components/progress-ring
 */
@Component({
  selector: 'k-progress-ring',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-progress-ring
        #element
        [attr.value]="value"
        [attr.label]="label">
      <ng-content />
    </wa-progress-ring>
  `,
  styleUrl: './progress-ring.component.css',
})
export class ProgressRingComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Current progress (0-100) */
  @Input() value?: number;
  /** Accessible label */
  @Input() label?: string;

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
