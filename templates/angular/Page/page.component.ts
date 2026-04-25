import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/page/page.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/page/page.js'));
}

/**
 * Pages offer an easy way to scaffold entire page layouts using minimal markup
 *
 * @see https://webawesome.com/docs/components/page
 */
@Component({
  selector: 'k-page',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-page
        #element
        [attr.disable-navigation-toggle]="disableNavigationToggle || null"
        [attr.mobile-breakpoint]="mobileBreakpoint"
        [attr.navigation-placement]="navigationPlacement"
        [attr.nav-open]="navOpen || null"
        [attr.view]="view">
      <ng-content />
    </wa-page>
  `,
  styleUrl: './page.component.css',
})
export class PageComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Hide default hamburger button; auto-sets true if custom toggle element present */
  @Input() disableNavigationToggle?: boolean;
  /** Viewport width threshold for navigation collapse; accepts numbers (px) or CSS lengths */
  @Input() mobileBreakpoint?: string;
  /** Navigation drawer position on mobile */
  @Input() navigationPlacement?: 'start' | 'end';
  /** Mobile navigation drawer open state */
  @Input() navOpen?: boolean;
  /** Current viewport classification relative to breakpoint */
  @Input() view?: 'mobile' | 'desktop';

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

  visiblePixelsInViewport(element?: unknown): void {
    (this.elementRef.nativeElement as unknown as { visiblePixelsInViewport: (element: unknown) => void }).visiblePixelsInViewport(element);
  }
  showNavigation(): void {
    (this.elementRef.nativeElement as unknown as { showNavigation: () => void }).showNavigation();
  }
  hideNavigation(): void {
    (this.elementRef.nativeElement as unknown as { hideNavigation: () => void }).hideNavigation();
  }
  toggleNavigation(): void {
    (this.elementRef.nativeElement as unknown as { toggleNavigation: () => void }).toggleNavigation();
  }
}
