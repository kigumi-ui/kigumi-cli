import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/split-panel/split-panel.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/split-panel/split-panel.js'));
}

/**
 * Split panels display two adjacent panels with a divider for resizing
 *
 * @see https://webawesome.com/docs/components/split-panel
 */
@Component({
  selector: 'k-split-panel',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-split-panel
        #element
        [attr.position]="position"
        [attr.position-in-pixels]="positionInPixels"
        [attr.orientation]="orientation"
        [attr.primary]="primary"
        [attr.disabled]="disabled || null"
        [attr.snap]="snap"
        [attr.snap-threshold]="snapThreshold">
      <ng-content />
    </wa-split-panel>
  `,
  styleUrl: './split-panel.component.css',
})
export class SplitPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Divider position (%) */
  @Input() position?: number;
  /** Divider position (px) */
  @Input() positionInPixels?: number;
  /** Panel orientation */
  @Input() orientation?: 'horizontal' | 'vertical';
  /** Primary panel */
  @Input() primary?: 'start' | 'end';
  /** Disables resizing */
  @Input() disabled?: boolean;
  /** Snap points */
  @Input() snap?: string;
  /** Snap threshold (px) */
  @Input() snapThreshold?: number;

  @Output() reposition = new EventEmitter<CustomEvent>();

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

    const handleReposition = (e: Event) => this.reposition.emit(e as CustomEvent);
    el.addEventListener('wa-reposition', handleReposition);
    this.cleanups.push(() => el.removeEventListener('wa-reposition', handleReposition));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
