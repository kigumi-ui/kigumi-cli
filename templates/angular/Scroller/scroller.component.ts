import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/scroller/scroller.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/scroller/scroller.js'));
}

/**
 * Adds a scrollable container with optional shadow indicators
 *
 * @see https://webawesome.com/docs/components/scroller
 */
@Component({
  selector: 'k-scroller',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-scroller
      #element
      [attr.orientation]="orientation"
      [attr.with-scroll-indicator]="withScrollIndicator || null"
      [attr.without-scrollbar]="withoutScrollbar || null"
      [attr.without-shadow]="withoutShadow || null"
    >
      <ng-content />
    </wa-scroller>
  `,
  styleUrl: './scroller.component.css',
})
export class ScrollerComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Scroll direction */
  @Input() orientation?: 'horizontal' | 'vertical' | 'both';
  /** Shows shadow indicators */
  @Input() withScrollIndicator?: boolean;
  /** Hides the scrollbar */
  @Input() withoutScrollbar?: boolean;
  /** Hides shadow indicators */
  @Input() withoutShadow?: boolean;

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
  }
}
