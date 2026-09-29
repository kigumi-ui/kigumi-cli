import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import type { WaCopyEvent } from '@awesome.me/webawesome/dist/events/copy.js';
import type { WaErrorEvent } from '@awesome.me/webawesome/dist/events/error.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/copy-button/copy-button.js'));
}

/**
 * Copies text data to the clipboard when clicked
 *
 * @see https://webawesome.com/docs/components/copy-button
 */
@Component({
  selector: 'k-copy-button',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-copy-button
      #element
      [attr.value]="value"
      [attr.from]="from"
      [attr.disabled]="disabled || null"
      [attr.copy-label]="copyLabel"
      [attr.success-label]="successLabel"
      [attr.error-label]="errorLabel"
      [attr.feedback-duration]="feedbackDuration"
      [attr.tooltip]="tooltip"
      [attr.tooltip-placement]="tooltipPlacement"
    >
      <ng-content />
    </wa-copy-button>
  `,
  styleUrl: './copy-button.component.css',
})
export class CopyButtonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The text to copy */
  @Input() value?: string;
  /** Element selector to copy text from */
  @Input() from?: string;
  /** Disables the button */
  @Input() disabled?: boolean;
  /** Tooltip label for copy state */
  @Input() copyLabel?: string;
  /** Tooltip label for success state */
  @Input() successLabel?: string;
  /** Tooltip label for error state */
  @Input() errorLabel?: string;
  /** Duration of feedback state in milliseconds */
  @Input() feedbackDuration?: number;
  /** When the tooltip shows: full (on hover, focus and after copying), copy (only after copying) or none */
  @Input() tooltip?: 'full' | 'copy' | 'none';
  /** Tooltip position */
  @Input() tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';

  @Output() copy = new EventEmitter<WaCopyEvent>();
  @Output() error = new EventEmitter<WaErrorEvent>();

  private cleanups: (() => void)[] = [];

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

    const handleCopy = (e: Event) => this.copy.emit(e as WaCopyEvent);
    el.addEventListener('wa-copy', handleCopy);
    this.cleanups.push(() => el.removeEventListener('wa-copy', handleCopy));
    const handleError = (e: Event) => this.error.emit(e as WaErrorEvent);
    el.addEventListener('wa-error', handleError);
    this.cleanups.push(() => el.removeEventListener('wa-error', handleError));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
