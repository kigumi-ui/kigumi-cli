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
import type WaElement from '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/dropdown/dropdown.js'));
}

/**
 * Dropdowns expose additional content that pops up when the user interacts with a trigger
 *
 * @see https://webawesome.com/docs/components/dropdown
 */
@Component({
  selector: 'k-dropdown',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-dropdown
      #element
      [attr.open]="open || null"
      [attr.placement]="placement"
      [attr.disabled]="disabled || null"
      [attr.stay-open-on-select]="stayOpenOnSelect || null"
      [attr.distance]="distance"
      [attr.skidding]="skidding"
      [attr.hoist]="hoist || null"
      [attr.size]="size"
    >
      <ng-content />
    </wa-dropdown>
  `,
  styleUrl: './dropdown.component.css',
})
export class DropdownComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Indicates whether the dropdown is open */
  @Input() open?: boolean;
  /** Preferred placement of the dropdown panel */
  @Input() placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  /** Disables the dropdown */
  @Input() disabled?: boolean;
  /** Keeps the dropdown open when an item is selected */
  @Input() stayOpenOnSelect?: boolean;
  /** Distance from the panel to the trigger */
  @Input() distance?: number;
  /** Offset along the trigger */
  @Input() skidding?: number;
  /** Hoists the dropdown panel to the body */
  @Input() hoist?: boolean;
  /** Dropdown size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  @Output() show = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hide = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();
  @Output() select = new EventEmitter<CustomEvent>();

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

    const handleShow = (e: Event) => this.show.emit(e as CustomEvent);
    el.addEventListener('wa-show', handleShow);
    this.cleanups.push(() => el.removeEventListener('wa-show', handleShow));
    const handleAfterShow = (e: Event) => this.afterShow.emit(e as CustomEvent);
    el.addEventListener('wa-after-show', handleAfterShow);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-show', handleAfterShow)
    );
    const handleHide = (e: Event) => this.hide.emit(e as CustomEvent);
    el.addEventListener('wa-hide', handleHide);
    this.cleanups.push(() => el.removeEventListener('wa-hide', handleHide));
    const handleAfterHide = (e: Event) => this.afterHide.emit(e as CustomEvent);
    el.addEventListener('wa-after-hide', handleAfterHide);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-hide', handleAfterHide)
    );
    const handleSelect = (e: Event) => this.select.emit(e as CustomEvent);
    el.addEventListener('wa-select', handleSelect);
    this.cleanups.push(() => el.removeEventListener('wa-select', handleSelect));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
