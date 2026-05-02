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
import type WaElement from '@awesome.me/webawesome/dist/components/animated-image/animated-image.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/animated-image/animated-image.js'));
}

/**
 * A component for displaying animated GIFs and WEBPs that play and pause on interaction
 *
 * @see https://webawesome.com/docs/components/animated-image
 */
@Component({
  selector: 'k-animated-image',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-animated-image
      #element
      [attr.src]="src"
      [attr.alt]="alt"
      [attr.play]="play || null"
    >
      <ng-content />
    </wa-animated-image>
  `,
  styleUrl: './animated-image.component.css',
})
export class AnimatedImageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The path to the image to load */
  @Input() src?: string;
  /** A description of the image used by assistive devices */
  @Input() alt?: string;
  /** Plays the animation. When this attribute is removed, the animation will pause */
  @Input() play?: boolean;

  @Output() load = new EventEmitter<CustomEvent>();
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

    const handleLoad = (e: Event) => this.load.emit(e as CustomEvent);
    el.addEventListener('wa-load', handleLoad);
    this.cleanups.push(() => el.removeEventListener('wa-load', handleLoad));
    const handleError = (e: Event) => this.error.emit(e as CustomEvent);
    el.addEventListener('wa-error', handleError);
    this.cleanups.push(() => el.removeEventListener('wa-error', handleError));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
