import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js'));
}

/**
 * Breadcrumb Items are used inside breadcrumbs to represent different links
 *
 * @see https://webawesome.com/docs/components/breadcrumb-item
 */
@Component({
  selector: 'k-breadcrumb-item',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-breadcrumb-item
        #element
        [attr.href]="href"
        [attr.target]="target"
        [attr.rel]="rel">
      <ng-content />
    </wa-breadcrumb-item>
  `,
  styleUrl: './breadcrumb-item.component.css',
})
export class BreadcrumbItemComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Optional URL to direct the user to when activated */
  @Input() href?: string;
  /** Tells the browser where to open the link */
  @Input() target?: '_blank' | '_parent' | '_self' | '_top';
  /** The rel attribute to use on the link */
  @Input() rel?: string;

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
