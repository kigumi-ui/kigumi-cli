import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js'));
}

/**
 * Observes changes to a target element and emits events when they occur
 *
 * @see https://webawesome.com/docs/components/mutation-observer
 */
@Component({
  selector: 'k-mutation-observer',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-mutation-observer
        #element
        [attr.attr]="attr"
        [attr.attr-old-value]="attrOldValue || null"
        [attr.char-data]="charData || null"
        [attr.char-data-old-value]="charDataOldValue || null"
        [attr.child-list]="childList || null"
        [attr.disabled]="disabled || null"
        [attr.subtree]="subtree || null">
      <ng-content />
    </wa-mutation-observer>
  `,
  styleUrl: './mutation-observer.component.css',
})
export class MutationObserverComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Space-separated list of attributes to observe */
  @Input() attr?: string;
  /** Records previous attribute values */
  @Input() attrOldValue?: boolean;
  /** Observes character data changes */
  @Input() charData?: boolean;
  /** Records previous character data */
  @Input() charDataOldValue?: boolean;
  /** Observes child node changes */
  @Input() childList?: boolean;
  /** Disables the observer */
  @Input() disabled?: boolean;
  /** Observes changes in subtree */
  @Input() subtree?: boolean;

  @Output() mutation = new EventEmitter<CustomEvent>();

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

    const handleMutation = (e: Event) => this.mutation.emit(e as CustomEvent);
    el.addEventListener('wa-mutation', handleMutation);
    this.cleanups.push(() => el.removeEventListener('wa-mutation', handleMutation));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
