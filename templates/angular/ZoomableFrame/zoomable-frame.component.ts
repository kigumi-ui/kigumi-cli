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
import type WaElement from '@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js'));
}

/**
 * Zoomable frames display iframe content with zoom controls
 *
 * @see https://webawesome.com/docs/components/zoomable-frame
 */
@Component({
  selector: 'k-zoomable-frame',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-zoomable-frame
      #element
      [attr.src]="src"
      [attr.srcdoc]="srcdoc"
      [attr.zoom]="zoom"
      [attr.zoom-levels]="zoomLevels"
      [attr.allowfullscreen]="allowfullscreen || null"
      [attr.loading]="loading"
      [attr.without-controls]="withoutControls || null"
      [attr.without-interaction]="withoutInteraction || null"
      [attr.sandbox]="sandbox"
      [attr.referrerpolicy]="referrerpolicy"
    >
      <ng-content />
    </wa-zoomable-frame>
  `,
  styleUrl: './zoomable-frame.component.css',
})
export class ZoomableFrameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** URL of content to display */
  @Input() src?: string;
  /** Inline HTML to render */
  @Input() srcdoc?: string;
  /** Current zoom level */
  @Input() zoom?: number;
  /** Available zoom levels */
  @Input() zoomLevels?: string;
  /** Enables fullscreen */
  @Input() allowfullscreen?: boolean;
  /** Loading behavior */
  @Input() loading?: 'eager' | 'lazy';
  /** Hides zoom controls */
  @Input() withoutControls?: boolean;
  /** Disables interaction */
  @Input() withoutInteraction?: boolean;
  /** Security restrictions */
  @Input() sandbox?: string;
  /** Referrer policy */
  @Input() referrerpolicy?: string;

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
    el.addEventListener('load', handleLoad);
    this.cleanups.push(() => el.removeEventListener('load', handleLoad));
    const handleError = (e: Event) => this.error.emit(e as CustomEvent);
    el.addEventListener('error', handleError);
    this.cleanups.push(() => el.removeEventListener('error', handleError));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  zoomIn(): void {
    (
      this.elementRef.nativeElement as unknown as { zoomIn: () => void }
    ).zoomIn();
  }
  zoomOut(): void {
    (
      this.elementRef.nativeElement as unknown as { zoomOut: () => void }
    ).zoomOut();
  }
}
