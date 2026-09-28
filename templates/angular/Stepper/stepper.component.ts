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
import type WaElement from '@awesome.me/webawesome/dist/components/stepper/stepper.js';
import type { WaBeforeStepChangeEvent } from '@awesome.me/webawesome/dist/events/before-step-change.js';
import type { WaStepChangeEvent } from '@awesome.me/webawesome/dist/events/step-change.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/stepper/stepper.js'));
}

/**
 * Steppers walk users through a multi-stage process and show where they are in it
 *
 * @see https://webawesome.com/docs/components/stepper
 */
@Component({
  selector: 'k-stepper',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-stepper
      #element
      [attr.active]="active"
      [attr.orientation]="orientation"
      [attr.linear]="linear || null"
      [attr.clickable]="clickable || null"
      [attr.label]="label"
    >
      <ng-content />
    </wa-stepper>
  `,
  styleUrl: './stepper.component.css',
})
export class StepperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Name of the current step; the first step when unset or unmatched */
  @Input() active?: string;
  /** Layout direction; auto stacks the steps when they run out of room */
  @Input() orientation?: 'horizontal' | 'vertical' | 'auto';
  /** Steps can only be reached once the ones before are done */
  @Input() linear?: boolean;
  /** Lets users jump to a step by clicking or activating it */
  @Input() clickable?: boolean;
  /** Accessible name for the stepper */
  @Input() label?: string;

  @Output() beforeStepChange = new EventEmitter<WaBeforeStepChangeEvent>();
  @Output() stepChange = new EventEmitter<WaStepChangeEvent>();

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

    const handleBeforeStepChange = (e: Event) =>
      this.beforeStepChange.emit(e as WaBeforeStepChangeEvent);
    el.addEventListener('wa-before-step-change', handleBeforeStepChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-before-step-change', handleBeforeStepChange)
    );
    const handleStepChange = (e: Event) =>
      this.stepChange.emit(e as WaStepChangeEvent);
    el.addEventListener('wa-step-change', handleStepChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-step-change', handleStepChange)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  goTo(name?: string): void {
    (
      this.elementRef.nativeElement as unknown as {
        goTo: (name?: string) => void;
      }
    ).goTo(name);
  }
  next(): void {
    (this.elementRef.nativeElement as unknown as { next: () => void }).next();
  }
  previous(): void {
    (
      this.elementRef.nativeElement as unknown as { previous: () => void }
    ).previous();
  }
}
