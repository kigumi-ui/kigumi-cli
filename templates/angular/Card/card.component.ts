import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/card/card.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/card/card.js'));
}

/**
 * Cards can be used to group related subjects in a container
 *
 * @see https://webawesome.com/docs/components/card
 */
@Component({
  selector: 'k-card',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-card
      #element
      [attr.appearance]="appearance"
      [attr.orientation]="orientation"
      [attr.with-header]="withHeader || null"
      [attr.with-footer]="withFooter || null"
      [attr.with-media]="withMedia || null"
    >
      <ng-content />
    </wa-card>
  `,
  styleUrl: './card.component.css',
})
export class CardComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Visual appearance style */
  @Input() appearance?:
    | 'outlined'
    | 'filled-outlined'
    | 'plain'
    | 'filled'
    | 'accent';
  /** Card layout orientation */
  @Input() orientation?: 'vertical' | 'horizontal';
  /** Adds header section (for SSR) */
  @Input() withHeader?: boolean;
  /** Adds footer section (for SSR) */
  @Input() withFooter?: boolean;
  /** Adds media section (for SSR) */
  @Input() withMedia?: boolean;

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
