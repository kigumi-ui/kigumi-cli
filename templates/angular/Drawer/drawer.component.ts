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
import type WaElement from '@awesome.me/webawesome/dist/components/drawer/drawer.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/drawer/drawer.js'));
}

/**
 * Drawers slide in from a container edge to expose additional options
 *
 * @see https://webawesome.com/docs/components/drawer
 *
 * @remarks Open and close programmatically by toggling the `open` attribute (e.g. `[open]="isOpen"`). The previous `show()` / `requestClose()` methods are marked private in WA 3.5.0+ and are no longer exposed.
 */
@Component({
  selector: 'k-drawer',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-drawer
      #element
      [attr.open]="open || null"
      [attr.label]="label"
      [attr.placement]="placement"
      [attr.light-dismiss]="lightDismiss || null"
      [attr.without-header]="withoutHeader || null"
    >
      <ng-content />
    </wa-drawer>
  `,
  styleUrl: './drawer.component.css',
})
export class DrawerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Indicates whether the drawer is open */
  @Input() open?: boolean;
  /** The drawer's label as displayed in the header */
  @Input() label?: string;
  /** The direction from which the drawer will open */
  @Input() placement?: 'top' | 'end' | 'bottom' | 'start';
  /** Closes the drawer when the user clicks outside of it */
  @Input() lightDismiss?: boolean;
  /** Removes the header */
  @Input() withoutHeader?: boolean;

  @Output() show = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hide = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();

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
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
