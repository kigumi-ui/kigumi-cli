import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/callout/callout.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/callout/callout.js'));
}

/**
 * Callouts are used to display important messages inline
 *
 * @see https://webawesome.com/docs/components/callout
 */
@Component({
  selector: 'k-callout',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-callout
      #element
      [attr.appearance]="appearance"
      [attr.size]="size"
      [attr.variant]="variant"
    >
      <ng-content />
    </wa-callout>
  `,
  styleUrl: './callout.component.css',
})
export class CalloutComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The callout's visual appearance */
  @Input() appearance?:
    'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined';
  /** The callout's size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** The callout's theme variant */
  @Input() variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

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
