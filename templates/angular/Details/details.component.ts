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
import type WaElement from '@awesome.me/webawesome/dist/components/details/details.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/details/details.js'));
}

/**
 * Shows a brief summary and expands to show additional content
 *
 * @see https://webawesome.com/docs/components/details
 */
@Component({
  selector: 'k-details',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-details
      #element
      [attr.open]="open || null"
      [attr.summary]="summary"
      [attr.disabled]="disabled || null"
      [attr.appearance]="appearance"
      [attr.icon-placement]="iconPlacement"
      [attr.name]="name"
    >
      <ng-content />
    </wa-details>
  `,
  styleUrl: './details.component.css',
})
export class DetailsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Whether the details are expanded */
  @Input() open?: boolean;
  /** Summary text shown in header */
  @Input() summary?: string;
  /** Disables the details */
  @Input() disabled?: boolean;
  /** Visual appearance style */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';
  /** Position of the expand icon */
  @Input() iconPlacement?: 'start' | 'end';
  /** Name for accordion grouping */
  @Input() name?: string;

  @Output() showEvent = new EventEmitter<WaShowEvent>();
  @Output() afterShow = new EventEmitter<WaAfterShowEvent>();
  @Output() hideEvent = new EventEmitter<WaHideEvent>();
  @Output() afterHide = new EventEmitter<WaAfterHideEvent>();

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

    const handleShowEvent = (e: Event) => this.showEvent.emit(e as WaShowEvent);
    el.addEventListener('wa-show', handleShowEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-show', handleShowEvent)
    );
    const handleAfterShow = (e: Event) =>
      this.afterShow.emit(e as WaAfterShowEvent);
    el.addEventListener('wa-after-show', handleAfterShow);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-show', handleAfterShow)
    );
    const handleHideEvent = (e: Event) => this.hideEvent.emit(e as WaHideEvent);
    el.addEventListener('wa-hide', handleHideEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-hide', handleHideEvent)
    );
    const handleAfterHide = (e: Event) =>
      this.afterHide.emit(e as WaAfterHideEvent);
    el.addEventListener('wa-after-hide', handleAfterHide);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-hide', handleAfterHide)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  show(): void {
    (this.elementRef.nativeElement as unknown as { show: () => void }).show();
  }
  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
  }
}
