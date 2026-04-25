import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/button-group/button-group.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/button-group/button-group.js'));
}

/**
 * Groups related buttons into organized sections, supporting both horizontal and vertical layouts
 *
 * @see https://webawesome.com/docs/components/button-group
 */
@Component({
  selector: 'k-button-group',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-button-group
        #element
        [attr.label]="label"
        [attr.orientation]="orientation">
      <ng-content />
    </wa-button-group>
  `,
  styleUrl: './button-group.component.css',
})
export class ButtonGroupComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** A label to use for the button group. This won't be displayed on the screen, but it will be announced by assistive devices */
  @Input() label?: string;
  /** Controls the button group's layout direction */
  @Input() orientation?: 'horizontal' | 'vertical';

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
