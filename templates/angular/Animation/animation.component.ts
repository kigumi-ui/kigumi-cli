import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/animation/animation.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/animation/animation.js'));
}

/**
 * Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes
 *
 * @see https://webawesome.com/docs/components/animation
 */
@Component({
  selector: 'k-animation',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-animation
        #element
        [attr.name]="name"
        [attr.play]="play || null"
        [attr.delay]="delay"
        [attr.direction]="direction"
        [attr.duration]="duration"
        [attr.easing]="easing"
        [attr.end-delay]="endDelay"
        [attr.fill]="fill"
        [attr.iterations]="iterations"
        [attr.iteration-start]="iterationStart"
        [attr.playback-rate]="playbackRate">
      <ng-content />
    </wa-animation>
  `,
  styleUrl: './animation.component.css',
})
export class AnimationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The name of the built-in animation to use */
  @Input() name?: string;
  /** Plays the animation. When omitted, the animation will be paused */
  @Input() play?: boolean;
  /** The number of milliseconds to delay the start of the animation */
  @Input() delay?: number;
  /** Determines the direction of playback */
  @Input() direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  /** The number of milliseconds each iteration takes to complete */
  @Input() duration?: number;
  /** The easing function to use */
  @Input() easing?: string;
  /** The number of milliseconds to delay after the active period */
  @Input() endDelay?: number;
  /** Sets how the animation applies styles before and after execution */
  @Input() fill?: 'auto' | 'backwards' | 'both' | 'forwards' | 'none';
  /** The number of iterations to run before completing */
  @Input() iterations?: number;
  /** The offset at which to start the animation */
  @Input() iterationStart?: number;
  /** Sets the animation's playback rate */
  @Input() playbackRate?: number;

  @Output() cancelEvent = new EventEmitter<CustomEvent>();
  @Output() finishEvent = new EventEmitter<CustomEvent>();
  @Output() start = new EventEmitter<CustomEvent>();

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

    const handleCancelEvent = (e: Event) => this.cancelEvent.emit(e as CustomEvent);
    el.addEventListener('wa-cancel', handleCancelEvent);
    this.cleanups.push(() => el.removeEventListener('wa-cancel', handleCancelEvent));
    const handleFinishEvent = (e: Event) => this.finishEvent.emit(e as CustomEvent);
    el.addEventListener('wa-finish', handleFinishEvent);
    this.cleanups.push(() => el.removeEventListener('wa-finish', handleFinishEvent));
    const handleStart = (e: Event) => this.start.emit(e as CustomEvent);
    el.addEventListener('wa-start', handleStart);
    this.cleanups.push(() => el.removeEventListener('wa-start', handleStart));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  cancel(): void {
    (this.elementRef.nativeElement as unknown as { cancel: () => void }).cancel();
  }
  finish(): void {
    (this.elementRef.nativeElement as unknown as { finish: () => void }).finish();
  }
}
