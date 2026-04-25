import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/skeleton/skeleton.js'));
}

/**
 * Skeletons are used to provide a visual representation of where content will eventually load
 *
 * @see https://webawesome.com/docs/components/skeleton
 */
@Component({
  selector: 'k-skeleton',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-skeleton
        #element
        [attr.effect]="effect">
      <ng-content />
    </wa-skeleton>
  `,
  styleUrl: './skeleton.component.css',
})
export class SkeletonComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Animation effect */
  @Input() effect?: 'pulse' | 'sheen' | 'none';

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
