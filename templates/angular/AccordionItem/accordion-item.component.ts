import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js'));
}

/**
 * Accordion items are the individual disclosure panels placed inside an accordion
 *
 * @see https://webawesome.com/docs/components/accordion-item
 */
@Component({
  selector: 'k-accordion-item',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-accordion-item
      #element
      [attr.label]="label"
      [attr.expanded]="expanded || null"
      [attr.disabled]="disabled || null"
    >
      <ng-content />
    </wa-accordion-item>
  `,
  styleUrl: './accordion-item.component.css',
})
export class AccordionItemComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The header text. Use the `label` slot for markup-rich headers. */
  @Input() label?: string;
  /** Whether the item is expanded */
  @Input() expanded?: boolean;
  /** Whether the item is disabled and cannot be toggled */
  @Input() disabled?: boolean;

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

  expand(): void {
    (
      this.elementRef.nativeElement as unknown as { expand: () => void }
    ).expand();
  }
  collapse(): void {
    (
      this.elementRef.nativeElement as unknown as { collapse: () => void }
    ).collapse();
  }
  toggle(): void {
    (
      this.elementRef.nativeElement as unknown as { toggle: () => void }
    ).toggle();
  }
  focus(options?: FocusOptions): void {
    (
      this.elementRef.nativeElement as unknown as {
        focus: (options?: FocusOptions) => void;
      }
    ).focus(options);
  }
}
