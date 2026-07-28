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
import type WaElement from '@awesome.me/webawesome/dist/components/random-content/random-content.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/random-content/random-content.js'));
}

/**
 * Randomly selects and displays one or more of its child elements
 *
 * @see https://webawesome.com/docs/components/random-content
 */
@Component({
  selector: 'k-random-content',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-random-content
      #element
      [attr.items]="items"
      [attr.mode]="mode"
      [attr.autoplay]="autoplay || null"
      [attr.autoplay-interval]="autoplayInterval"
      [attr.animation]="animation"
    >
      <ng-content />
    </wa-random-content>
  `,
  styleUrl: './random-content.component.css',
})
export class RandomContentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The number of items to display at once */
  @Input() items?: number;
  /** How items are picked on each randomization */
  @Input() mode?: 'random' | 'unique' | 'sequence';
  /** Automatically randomizes the displayed items on an interval */
  @Input() autoplay?: boolean;
  /** The number of milliseconds between randomizations when autoplay is enabled */
  @Input() autoplayInterval?: number;
  /** The animation to apply when displayed items change */
  @Input() animation?:
    'none' | 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right';

  @Output() contentChange = new EventEmitter<CustomEvent>();

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

    const handleContentChange = (e: Event) =>
      this.contentChange.emit(e as CustomEvent);
    el.addEventListener('wa-content-change', handleContentChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-content-change', handleContentChange)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  randomize(): void {
    (
      this.elementRef.nativeElement as unknown as { randomize: () => void }
    ).randomize();
  }
}
