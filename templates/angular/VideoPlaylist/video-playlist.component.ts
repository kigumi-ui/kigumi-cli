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
import type WaElement from '@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video-playlist/video-playlist.js'));
}

/**
 * Groups multiple videos into a playlist with next/previous navigation
 *
 * @see https://webawesome.com/docs/components/video-playlist
 */
@Component({
  selector: 'k-video-playlist',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-video-playlist
      #element
      [attr.controls]="controls"
      [attr.icon-library]="iconLibrary"
    >
      <ng-content />
    </wa-video-playlist>
  `,
  styleUrl: './video-playlist.component.css',
})
export class VideoPlaylistComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The set of controls forwarded to each child video */
  @Input() controls?: 'none' | 'standard' | 'full';
  /** The icon library used for placeholder icons */
  @Input() iconLibrary?: string;

  @Output() videoChange = new EventEmitter<CustomEvent>();

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

    const handleVideoChange = (e: Event) =>
      this.videoChange.emit(e as CustomEvent);
    el.addEventListener('wa-video-change', handleVideoChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-video-change', handleVideoChange)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  next(): void {
    (this.elementRef.nativeElement as unknown as { next: () => void }).next();
  }
  previous(): void {
    (
      this.elementRef.nativeElement as unknown as { previous: () => void }
    ).previous();
  }
  goTo(index?: number): void {
    (
      this.elementRef.nativeElement as unknown as {
        goTo: (index?: number) => void;
      }
    ).goTo(index);
  }
}
