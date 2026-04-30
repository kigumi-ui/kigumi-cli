import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import type WaElement from '@awesome.me/webawesome/dist/components/icon/icon.js';

/**
 * Icons are symbols that can be used to represent various options within an application
 *
 * @see https://webawesome.com/docs/components/icon
 */
@Component({
  selector: 'k-icon',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-icon
        #element
        [attr.name]="name"
        [attr.library]="library"
        [attr.src]="src"
        [attr.label]="label"
        [attr.family]="family"
        [attr.variant]="variant"
        [attr.auto-width]="autoWidth || null"
        [attr.swap-opacity]="swapOpacity || null"
        [attr.rotate]="rotate"
        [attr.flip]="flip"
        [attr.animation]="animation">
      <ng-content />
    </wa-icon>
  `,
  styleUrl: './icon.component.css',
})
export class IconComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The name of the icon to draw */
  @Input() name?: string;
  /** The name of a registered custom icon library */
  @Input() library?: string;
  /** An external URL of an SVG file */
  @Input() src?: string;
  /** An alternate description for assistive devices */
  @Input() label?: string;
  /** The family of icons (classic, brands, sharp, duotone, sharp-duotone) */
  @Input() family?: string;
  /** The icon's variant (thin, light, regular, solid) */
  @Input() variant?: string;
  /** Sets the width to match the cropped SVG viewBox */
  @Input() autoWidth?: boolean;
  /** Swaps the opacity of duotone icons */
  @Input() swapOpacity?: boolean;
  /** Rotate the icon by this many degrees */
  @Input() rotate?: number;
  /** Flip the icon horizontally, vertically, or both */
  @Input() flip?: 'horizontal' | 'vertical' | 'both';
  /** The name of a built-in animation to apply */
  @Input() animation?: string;

  @Output() load = new EventEmitter<CustomEvent>();
  @Output() error = new EventEmitter<CustomEvent>();

  private cleanups: (() => void)[] = [];

  ngAfterViewInit(): void {
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

    const handleLoad = (e: Event) => this.load.emit(e as CustomEvent);
    el.addEventListener('wa-load', handleLoad);
    this.cleanups.push(() => el.removeEventListener('wa-load', handleLoad));
    const handleError = (e: Event) => this.error.emit(e as CustomEvent);
    el.addEventListener('wa-error', handleError);
    this.cleanups.push(() => el.removeEventListener('wa-error', handleError));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
