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
import type WaElement from '@awesome.me/webawesome/dist/components/avatar/avatar.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/avatar/avatar.js'));
}

/**
 * Avatars are used to represent a person or object
 *
 * @see https://webawesome.com/docs/components/avatar
 */
@Component({
  selector: 'k-avatar',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-avatar
      #element
      [attr.image]="image"
      [attr.label]="label"
      [attr.initials]="initials"
      [attr.loading]="loading"
      [attr.shape]="shape"
    >
      <ng-content />
    </wa-avatar>
  `,
  styleUrl: './avatar.component.css',
})
export class AvatarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The image source to use for the avatar */
  @Input() image?: string;
  /** A label to use to describe the avatar to assistive devices */
  @Input() label?: string;
  /** Initials to use as a fallback when no image is available */
  @Input() initials?: string;
  /** Indicates how the browser should load the image */
  @Input() loading?: 'eager' | 'lazy';
  /** The shape of the avatar */
  @Input() shape?: 'circle' | 'square' | 'rounded';

  @Output() error = new EventEmitter<CustomEvent>();

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

    const handleError = (e: Event) => this.error.emit(e as CustomEvent);
    el.addEventListener('wa-error', handleError);
    this.cleanups.push(() => el.removeEventListener('wa-error', handleError));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
