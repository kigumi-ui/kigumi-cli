import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/step/step.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/step/step.js'));
}

/**
 * Steps are the individual stages of a stepper, each with a label and a status
 *
 * @see https://webawesome.com/docs/components/step
 */
@Component({
  selector: 'k-step',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-step
      #element
      [attr.name]="name"
      [attr.completed]="completed || null"
      [attr.loading]="loading || null"
      [attr.disabled]="disabled || null"
      [attr.variant]="variant"
      [attr.attention]="attention"
      [attr.active]="active || null"
    >
      <ng-content />
    </wa-step>
  `,
  styleUrl: './step.component.css',
})
export class StepComponent implements AfterViewInit {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The step's identifier; the stepper's active and its events use it */
  @Input() name?: string;
  /** Marks the step done and shows a checkmark */
  @Input() completed?: boolean;
  /** Shows a spinner in place of the step number */
  @Input() loading?: boolean;
  /** Makes the step unreachable and non-interactive */
  @Input() disabled?: boolean;
  /** Semantic color of the step marker */
  @Input() variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  /** Animates the marker to draw attention to the step */
  @Input() attention?: 'none' | 'pulse' | 'bounce';
  /** Whether this is the current step; set by the stepper */
  @Input() active?: boolean;

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
