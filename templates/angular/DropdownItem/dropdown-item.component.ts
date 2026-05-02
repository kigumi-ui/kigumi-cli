import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js'));
}

/**
 * Dropdown items are used inside dropdowns to represent individual menu items
 *
 * @see https://webawesome.com/docs/components/dropdown-item
 */
@Component({
  selector: 'k-dropdown-item',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-dropdown-item
      #element
      [attr.type]="type"
      [attr.checked]="checked || null"
      [attr.value]="value"
      [attr.disabled]="disabled || null"
      [attr.loading]="loading || null"
      [attr.variant]="variant"
    >
      <ng-content />
    </wa-dropdown-item>
  `,
  styleUrl: './dropdown-item.component.css',
})
export class DropdownItemComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The type of menu item */
  @Input() type?: 'normal' | 'checkbox';
  /** Draws the item in a checked state (checkbox type) */
  @Input() checked?: boolean;
  /** A unique value for the menu item */
  @Input() value?: string;
  /** Disables the menu item */
  @Input() disabled?: boolean;
  /** Draws the item in a loading state */
  @Input() loading?: boolean;
  /** The dropdown item variant */
  @Input() variant?: 'neutral' | 'danger';

  @Output() blur = new EventEmitter<CustomEvent>();
  @Output() focus = new EventEmitter<FocusEvent>();

  private cleanups: (() => void)[] = [];

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

    const handleBlur = (e: Event) => this.blur.emit(e as CustomEvent);
    el.addEventListener('blur', handleBlur);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlur));
    const handleFocus = (e: Event) => this.focus.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocus);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocus));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  openSubmenu(): void {
    (
      this.elementRef.nativeElement as unknown as { openSubmenu: () => void }
    ).openSubmenu();
  }
  closeSubmenu(): void {
    (
      this.elementRef.nativeElement as unknown as { closeSubmenu: () => void }
    ).closeSubmenu();
  }
}
