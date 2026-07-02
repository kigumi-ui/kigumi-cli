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
import type WaElement from '@awesome.me/webawesome/dist/components/video/video.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/video/video.js'));
}

/**
 * Displays a video player with customizable controls, captions, and thumbnails
 *
 * @see https://webawesome.com/docs/components/video
 */
@Component({
  selector: 'k-video',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-video
      #element
      [attr.controls]="controls"
      [attr.src]="src"
      [attr.poster]="poster"
      [attr.title]="title"
      [attr.thumbnails]="thumbnails"
      [attr.playing]="playing || null"
      [attr.muted]="muted || null"
      [attr.volume]="volume"
      [attr.autoplay]="autoplay || null"
      [attr.loop]="loop || null"
      [attr.autoplay-muted]="autoplayMuted || null"
      [attr.autoplay-on-visible]="autoplayOnVisible || null"
      [attr.preload]="preload"
      [attr.icon-library]="iconLibrary"
    >
      <ng-content />
    </wa-video>
  `,
  styleUrl: './video.component.css',
})
export class VideoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The set of controls to display */
  @Input() controls?: 'none' | 'standard' | 'full';
  /** The video source URL */
  @Input() src?: string;
  /** The poster image URL shown before playback */
  @Input() poster?: string;
  /** The video title */
  @Input() title?: string;
  /** URL to a WebVTT file for timeline thumbnail previews */
  @Input() thumbnails?: string;
  /** Whether the video is currently playing */
  @Input() playing?: boolean;
  /** Whether the video is muted */
  @Input() muted?: boolean;
  /** The volume level from 0 to 1 */
  @Input() volume?: number;
  /** Automatically start playback when connected */
  @Input() autoplay?: boolean;
  /** Restart playback when the video ends */
  @Input() loop?: boolean;
  /** Autoplay in a muted state */
  @Input() autoplayMuted?: boolean;
  /** Resume playback when scrolled back into view */
  @Input() autoplayOnVisible?: boolean;
  /** The browser preload strategy */
  @Input() preload?: 'auto' | 'metadata' | 'none';
  /** The icon library used for built-in control icons */
  @Input() iconLibrary?: string;

  @Output() timeupdate = new EventEmitter<CustomEvent>();
  @Output() playEvent = new EventEmitter<CustomEvent>();
  @Output() pauseEvent = new EventEmitter<CustomEvent>();
  @Output() volumechange = new EventEmitter<CustomEvent>();
  @Output() error = new EventEmitter<CustomEvent>();
  @Output() ended = new EventEmitter<CustomEvent>();
  @Output() loadedmetadata = new EventEmitter<CustomEvent>();

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

    const handleTimeupdate = (e: Event) =>
      this.timeupdate.emit(e as CustomEvent);
    el.addEventListener('timeupdate', handleTimeupdate);
    this.cleanups.push(() =>
      el.removeEventListener('timeupdate', handleTimeupdate)
    );
    const handlePlayEvent = (e: Event) => this.playEvent.emit(e as CustomEvent);
    el.addEventListener('play', handlePlayEvent);
    this.cleanups.push(() => el.removeEventListener('play', handlePlayEvent));
    const handlePauseEvent = (e: Event) =>
      this.pauseEvent.emit(e as CustomEvent);
    el.addEventListener('pause', handlePauseEvent);
    this.cleanups.push(() => el.removeEventListener('pause', handlePauseEvent));
    const handleVolumechange = (e: Event) =>
      this.volumechange.emit(e as CustomEvent);
    el.addEventListener('volumechange', handleVolumechange);
    this.cleanups.push(() =>
      el.removeEventListener('volumechange', handleVolumechange)
    );
    const handleError = (e: Event) => this.error.emit(e as CustomEvent);
    el.addEventListener('error', handleError);
    this.cleanups.push(() => el.removeEventListener('error', handleError));
    const handleEnded = (e: Event) => this.ended.emit(e as CustomEvent);
    el.addEventListener('ended', handleEnded);
    this.cleanups.push(() => el.removeEventListener('ended', handleEnded));
    const handleLoadedmetadata = (e: Event) =>
      this.loadedmetadata.emit(e as CustomEvent);
    el.addEventListener('loadedmetadata', handleLoadedmetadata);
    this.cleanups.push(() =>
      el.removeEventListener('loadedmetadata', handleLoadedmetadata)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  play(): void {
    (this.elementRef.nativeElement as unknown as { play: () => void }).play();
  }
  pause(): void {
    (this.elementRef.nativeElement as unknown as { pause: () => void }).pause();
  }
  togglePlay(): void {
    (
      this.elementRef.nativeElement as unknown as { togglePlay: () => void }
    ).togglePlay();
  }
  toggleMute(): void {
    (
      this.elementRef.nativeElement as unknown as { toggleMute: () => void }
    ).toggleMute();
  }
  seek(time?: number): void {
    (
      this.elementRef.nativeElement as unknown as {
        seek: (time?: number) => void;
      }
    ).seek(time);
  }
  setVolume(volume?: number): void {
    (
      this.elementRef.nativeElement as unknown as {
        setVolume: (volume?: number) => void;
      }
    ).setVolume(volume);
  }
  setPlaybackRate(rate?: number): void {
    (
      this.elementRef.nativeElement as unknown as {
        setPlaybackRate: (rate?: number) => void;
      }
    ).setPlaybackRate(rate);
  }
  requestFullscreen(): void {
    (
      this.elementRef.nativeElement as unknown as {
        requestFullscreen: () => void;
      }
    ).requestFullscreen();
  }
  exitFullscreen(): void {
    (
      this.elementRef.nativeElement as unknown as { exitFullscreen: () => void }
    ).exitFullscreen();
  }
  getVideoElement(): void {
    (
      this.elementRef.nativeElement as unknown as {
        getVideoElement: () => void;
      }
    ).getVideoElement();
  }
  getState(): void {
    (
      this.elementRef.nativeElement as unknown as { getState: () => void }
    ).getState();
  }
}
