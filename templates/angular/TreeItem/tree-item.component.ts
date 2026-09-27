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
import type WaElement from '@awesome.me/webawesome/dist/components/tree-item/tree-item.js';
import type { WaAfterCollapseEvent } from '@awesome.me/webawesome/dist/events/after-collapse.js';
import type { WaAfterExpandEvent } from '@awesome.me/webawesome/dist/events/after-expand.js';
import type { WaCollapseEvent } from '@awesome.me/webawesome/dist/events/collapse.js';
import type { WaExpandEvent } from '@awesome.me/webawesome/dist/events/expand.js';
import type { WaLazyChangeEvent } from '@awesome.me/webawesome/dist/events/lazy-change.js';
import type { WaLazyLoadEvent } from '@awesome.me/webawesome/dist/events/lazy-load.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tree-item/tree-item.js'));
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
      [attr.lazy]="lazy || null"
    >
      <ng-content />
    </wa-tree-item>
  `,
  styleUrl: './tree-item.component.css',
})
export class TreeItemComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Expands the item */
  @Input() expanded?: boolean;
  /** Selects the item */
  @Input() selected?: boolean;
  /** Disables the item */
  @Input() disabled?: boolean;
  /** Enables lazy loading */
  @Input() lazy?: boolean;

  @Output() expand = new EventEmitter<WaExpandEvent>();
  @Output() afterExpand = new EventEmitter<WaAfterExpandEvent>();
  @Output() collapse = new EventEmitter<WaCollapseEvent>();
  @Output() afterCollapse = new EventEmitter<WaAfterCollapseEvent>();
  @Output() lazyChange = new EventEmitter<WaLazyChangeEvent>();
  @Output() lazyLoad = new EventEmitter<WaLazyLoadEvent>();

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

    const handleExpand = (e: Event) => this.expand.emit(e as WaExpandEvent);
    el.addEventListener('wa-expand', handleExpand);
    this.cleanups.push(() => el.removeEventListener('wa-expand', handleExpand));
    const handleAfterExpand = (e: Event) =>
      this.afterExpand.emit(e as WaAfterExpandEvent);
    el.addEventListener('wa-after-expand', handleAfterExpand);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-expand', handleAfterExpand)
    );
    const handleCollapse = (e: Event) =>
      this.collapse.emit(e as WaCollapseEvent);
    el.addEventListener('wa-collapse', handleCollapse);
    this.cleanups.push(() =>
      el.removeEventListener('wa-collapse', handleCollapse)
    );
    const handleAfterCollapse = (e: Event) =>
      this.afterCollapse.emit(e as WaAfterCollapseEvent);
    el.addEventListener('wa-after-collapse', handleAfterCollapse);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-collapse', handleAfterCollapse)
    );
    const handleLazyChange = (e: Event) =>
      this.lazyChange.emit(e as WaLazyChangeEvent);
    el.addEventListener('wa-lazy-change', handleLazyChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-lazy-change', handleLazyChange)
    );
    const handleLazyLoad = (e: Event) =>
      this.lazyLoad.emit(e as WaLazyLoadEvent);
    el.addEventListener('wa-lazy-load', handleLazyLoad);
    this.cleanups.push(() =>
      el.removeEventListener('wa-lazy-load', handleLazyLoad)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  getChildrenItems(options?: { includeDisabled?: boolean }): void {
    (
      this.elementRef.nativeElement as unknown as {
        getChildrenItems: (options?: { includeDisabled?: boolean }) => void;
      }
    ).getChildrenItems(options);
  }
}
