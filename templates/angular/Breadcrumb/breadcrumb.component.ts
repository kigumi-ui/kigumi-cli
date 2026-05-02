import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js'));
}

/**
 * Breadcrumbs provide a group of links so users can easily navigate a website hierarchy
 *
 * @see https://webawesome.com/docs/components/breadcrumb
 */
@Component({
  selector: 'k-breadcrumb',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-breadcrumb #element [attr.label]="label">
      <ng-content />
    </wa-breadcrumb>
  `,
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The label to use for the breadcrumb control for assistive devices */
  @Input() label?: string;

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
