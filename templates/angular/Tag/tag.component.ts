import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/tag/tag.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tag/tag.js'));
}

/**
 * Tags are used as labels to organize things or indicate selections
 *
 * @see https://webawesome.com/docs/components/tag
 */
@Component({
  selector: 'k-tag',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-tag
        #element
        [attr.appearance]="appearance"
        [attr.pill]="pill || null"
        [attr.size]="size"
        [attr.variant]="variant"
        [attr.with-remove]="withRemove || null">
      <ng-content />
    </wa-tag>
  `,
  styleUrl: './tag.component.css',
})
export class TagComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Visual appearance */
  @Input() appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
  /** Rounded edges */
  @Input() pill?: boolean;
  /** Tag size */
  @Input() size?: 'small' | 'medium' | 'large';
  /** Theme variant */
  @Input() variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  /** Shows remove button */
  @Input() withRemove?: boolean;

  @Output() remove = new EventEmitter<CustomEvent>();

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

    const handleRemove = (e: Event) => this.remove.emit(e as CustomEvent);
    el.addEventListener('wa-remove', handleRemove);
    this.cleanups.push(() => el.removeEventListener('wa-remove', handleRemove));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
