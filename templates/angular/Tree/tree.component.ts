import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/tree/tree.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tree/tree.js'));
}

/**
 * Trees allow you to display a hierarchical list of selectable tree items
 *
 * @see https://webawesome.com/docs/components/tree
 */
@Component({
  selector: 'k-tree',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-tree
        #element
        [attr.selection]="selection">
      <ng-content />
    </wa-tree>
  `,
  styleUrl: './tree.component.css',
})
export class TreeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Selection behavior */
  @Input() selection?: 'single' | 'multiple' | 'leaf';

  @Output() selectionChange = new EventEmitter<CustomEvent>();

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

    const handleSelectionChange = (e: Event) => this.selectionChange.emit(e as CustomEvent);
    el.addEventListener('wa-selection-change', handleSelectionChange);
    this.cleanups.push(() => el.removeEventListener('wa-selection-change', handleSelectionChange));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
