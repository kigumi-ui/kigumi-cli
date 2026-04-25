import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/tree-item/tree-item.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tree-item/tree-item.js'));
}

/**
 * Tree items are used inside trees to represent hierarchical items
 *
 * @see https://webawesome.com/docs/components/tree-item
 */
@Component({
  selector: 'k-tree-item',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-tree-item
        #element
        [attr.expanded]="expanded || null"
        [attr.selected]="selected || null"
        [attr.disabled]="disabled || null"
        [attr.lazy]="lazy || null">
      <ng-content />
    </wa-tree-item>
  `,
  styleUrl: './tree-item.component.css',
})
export class TreeItemComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Expands the item */
  @Input() expanded?: boolean;
  /** Selects the item */
  @Input() selected?: boolean;
  /** Disables the item */
  @Input() disabled?: boolean;
  /** Enables lazy loading */
  @Input() lazy?: boolean;

  @Output() expand = new EventEmitter<CustomEvent>();
  @Output() afterExpand = new EventEmitter<CustomEvent>();
  @Output() collapse = new EventEmitter<CustomEvent>();
  @Output() afterCollapse = new EventEmitter<CustomEvent>();
  @Output() lazyChange = new EventEmitter<CustomEvent>();
  @Output() lazyLoad = new EventEmitter<CustomEvent>();

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

    const handleExpand = (e: Event) => this.expand.emit(e as CustomEvent);
    el.addEventListener('wa-expand', handleExpand);
    this.cleanups.push(() => el.removeEventListener('wa-expand', handleExpand));
    const handleAfterExpand = (e: Event) => this.afterExpand.emit(e as CustomEvent);
    el.addEventListener('wa-after-expand', handleAfterExpand);
    this.cleanups.push(() => el.removeEventListener('wa-after-expand', handleAfterExpand));
    const handleCollapse = (e: Event) => this.collapse.emit(e as CustomEvent);
    el.addEventListener('wa-collapse', handleCollapse);
    this.cleanups.push(() => el.removeEventListener('wa-collapse', handleCollapse));
    const handleAfterCollapse = (e: Event) => this.afterCollapse.emit(e as CustomEvent);
    el.addEventListener('wa-after-collapse', handleAfterCollapse);
    this.cleanups.push(() => el.removeEventListener('wa-after-collapse', handleAfterCollapse));
    const handleLazyChange = (e: Event) => this.lazyChange.emit(e as CustomEvent);
    el.addEventListener('wa-lazy-change', handleLazyChange);
    this.cleanups.push(() => el.removeEventListener('wa-lazy-change', handleLazyChange));
    const handleLazyLoad = (e: Event) => this.lazyLoad.emit(e as CustomEvent);
    el.addEventListener('wa-lazy-load', handleLazyLoad);
    this.cleanups.push(() => el.removeEventListener('wa-lazy-load', handleLazyLoad));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  getChildrenItems({ includeDisabled = true }?: unknown): void {
    (this.elementRef.nativeElement as unknown as { getChildrenItems: ({ includeDisabled = true }: unknown) => void }).getChildrenItems({ includeDisabled = true });
  }
}
