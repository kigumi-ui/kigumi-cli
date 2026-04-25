import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js'));
}

/**
 * Reports changes to the dimensions of an element
 *
 * @see https://webawesome.com/docs/components/resize-observer
 */
@Component({
  selector: 'k-resize-observer',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-resize-observer
        #element
        [attr.disabled]="disabled || null">
      <ng-content />
    </wa-resize-observer>
  `,
  styleUrl: './resize-observer.component.css',
})
export class ResizeObserverComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Disables the observer */
  @Input() disabled?: boolean;

  @Output() resize = new EventEmitter<CustomEvent>();

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

    const handleResize = (e: Event) => this.resize.emit(e as CustomEvent);
    el.addEventListener('wa-resize', handleResize);
    this.cleanups.push(() => el.removeEventListener('wa-resize', handleResize));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
