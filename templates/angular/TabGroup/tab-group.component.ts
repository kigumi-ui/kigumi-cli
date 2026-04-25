import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tab-group/tab-group.js'));
}

/**
 * Tab groups organize content into a container that shows one section at a time
 *
 * @see https://webawesome.com/docs/components/tab-group
 */
@Component({
  selector: 'k-tab-group',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-tab-group
        #element
        [attr.placement]="placement"
        [attr.activation]="activation"
        [attr.without-scroll-controls]="withoutScrollControls || null"
        [attr.active]="active">
      <ng-content />
    </wa-tab-group>
  `,
  styleUrl: './tab-group.component.css',
})
export class TabGroupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Tab position */
  @Input() placement?: 'top' | 'bottom' | 'start' | 'end';
  /** Panel activation method */
  @Input() activation?: 'auto' | 'manual';
  /** Disables scroll buttons */
  @Input() withoutScrollControls?: boolean;
  /** The name of the active tab */
  @Input() active?: string;

  @Output() tabShow = new EventEmitter<CustomEvent>();
  @Output() tabHide = new EventEmitter<CustomEvent>();

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

    const handleTabShow = (e: Event) => this.tabShow.emit(e as CustomEvent);
    el.addEventListener('wa-tab-show', handleTabShow);
    this.cleanups.push(() => el.removeEventListener('wa-tab-show', handleTabShow));
    const handleTabHide = (e: Event) => this.tabHide.emit(e as CustomEvent);
    el.addEventListener('wa-tab-hide', handleTabHide);
    this.cleanups.push(() => el.removeEventListener('wa-tab-hide', handleTabHide));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
