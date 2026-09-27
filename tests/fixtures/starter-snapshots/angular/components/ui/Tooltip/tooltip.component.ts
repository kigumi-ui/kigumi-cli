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
import type WaElement from '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tooltip/tooltip.js'));
}

/**
 * Tooltips display additional information based on a specific action
 *
 * @see https://webawesome.com/docs/components/tooltip
 */
@Component({
  selector: 'k-tooltip',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-tooltip
      #element
      [attr.placement]="placement"
      [attr.disabled]="disabled || null"
      [attr.distance]="distance"
      [attr.open]="open || null"
      [attr.skidding]="skidding"
      [attr.trigger]="trigger"
      [attr.without-arrow]="withoutArrow || null"
      [attr.show-delay]="showDelay"
      [attr.hide-delay]="hideDelay"
      [attr.for]="for"
    >
      <ng-content />
    </wa-tooltip>
  `,
  styleUrl: './tooltip.component.css',
})
export class TooltipComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Tooltip placement */
  @Input() placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  /** Disables the tooltip */
  @Input() disabled?: boolean;
  /** Distance from target */
  @Input() distance?: number;
  /** Whether the tooltip is open */
  @Input() open?: boolean;
  /** Offset along target */
  @Input() skidding?: number;
  /** Activation events */
  @Input() trigger?: string;
  /** Hides the arrow */
  @Input() withoutArrow?: boolean;
  /** Show delay (ms) */
  @Input() showDelay?: number;
  /** Hide delay (ms) */
  @Input() hideDelay?: number;
  /** The ID of the element the tooltip is anchored to */
  @Input() for?: string;

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
