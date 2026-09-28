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
import type WaElement from '@awesome.me/webawesome/dist/components/toast-item/toast-item.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/toast-item/toast-item.js'));
}

/**
 * A single notification banner that can be stacked inside a Toast container
 *
 * @see https://webawesome.com/docs/components/toast-item
 */
@Component({
  selector: 'k-toast-item',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-toast-item
      #element
      [attr.variant]="variant"
      [attr.size]="size"
      [attr.duration]="duration"
    >
      <ng-content />
    </wa-toast-item>
  `,
  styleUrl: './toast-item.component.css',
})
export class ToastItemComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Colour scheme reflecting the notification intent */
  @Input() variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  /** Controls the overall dimensions of the notification */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Milliseconds before auto-dismiss. Use 0 to keep the notification visible until closed. */
  @Input() duration?: number;

  @Output() show = new EventEmitter<WaShowEvent>();
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

    const handleShow = (e: Event) => this.show.emit(e as WaShowEvent);
    el.addEventListener('wa-show', handleShow);
    this.cleanups.push(() => el.removeEventListener('wa-show', handleShow));
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

  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
  }
}
