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
import type WaElement from '@awesome.me/webawesome/dist/components/date-input/date-input.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-input/date-input.js'));
}

/**
 * A segmented date field with an optional popup calendar, for use in forms
 *
 * @see https://webawesome.com/docs/components/date-input
 */
@Component({
  selector: 'k-date-input',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-date-input
      #element
      [attr.name]="name"
      [attr.value]="value"
      [attr.mode]="mode"
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.size]="size"
      [attr.appearance]="appearance"
      [attr.pill]="pill || null"
      [attr.required]="required || null"
      [attr.readonly]="readonly || null"
      [attr.disabled]="disabled || null"
      [attr.autocomplete]="autocomplete"
      [attr.with-clear]="withClear || null"
      [attr.min]="min"
      [attr.max]="max"
      [attr.today]="today"
      [attr.first-day-of-week]="firstDayOfWeek"
      [attr.disabled-dates]="disabledDates"
      [attr.disabled-days-of-week]="disabledDaysOfWeek"
      [attr.disable-past]="disablePast || null"
      [attr.disable-future]="disableFuture || null"
      [attr.min-range]="minRange"
      [attr.max-range]="maxRange"
      [attr.months]="months"
      [attr.page-by]="pageBy"
      [attr.with-outside-days]="withOutsideDays || null"
      [attr.with-week-numbers]="withWeekNumbers || null"
      [attr.weekday-format]="weekdayFormat"
      [attr.open]="open || null"
      [attr.placement]="placement"
      [attr.distance]="distance"
    >
      <ng-content />
    </wa-date-input>
  `,
  styleUrl: './date-input.component.css',
})
export class DateInputComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The name of the form control, submitted with form data */
  @Input() name?: string;
  /** The current value; ISO date or range */
  @Input() value?: string;
  /** The selection mode */
  @Input() mode?: 'single' | 'range';
  /** The input label (use the label slot for HTML) */
  @Input() label?: string;
  /** The hint text (use the hint slot for HTML) */
  @Input() hint?: string;
  /** The visual size */
  @Input() size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  /** The visual appearance */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** Draws the input with pill-style rounded edges */
  @Input() pill?: boolean;
  /** Makes the input required for form submission */
  @Input() required?: boolean;
  /** Makes the input non-editable */
  @Input() readonly?: boolean;
  /** Disables the input */
  @Input() disabled?: boolean;
  /** Forwarded to the hidden form input for browser autofill */
  @Input() autocomplete?: string;
  /** Shows a clear button when a value is present */
  @Input() withClear?: boolean;
  /** The earliest selectable date */
  @Input() min?: string;
  /** The latest selectable date */
  @Input() max?: string;
  /** Overrides the date considered "today" */
  @Input() today?: string;
  /** The first day of the week in the popup calendar */
  @Input() firstDayOfWeek?:
    'auto' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  /** Whitespace-separated ISO dates to disable */
  @Input() disabledDates?: string;
  /** Space-separated 3-letter weekday names to disable */
  @Input() disabledDaysOfWeek?: string;
  /** Disable all dates before today */
  @Input() disablePast?: boolean;
  /** Disable all dates after today */
  @Input() disableFuture?: boolean;
  /** Minimum range length in days (range mode); 0 disables the check */
  @Input() minRange?: number;
  /** Maximum range length in days (range mode); 0 disables the check */
  @Input() maxRange?: number;
  /** The number of months rendered in the popup calendar */
  @Input() months?: '1' | '2';
  /** Whether prev/next pages by the visible range or one month */
  @Input() pageBy?: 'months' | 'single';
  /** Show leading/trailing adjacent-month days in the popup */
  @Input() withOutsideDays?: boolean;
  /** Show ISO week numbers in the popup */
  @Input() withWeekNumbers?: boolean;
  /** The weekday header format in the popup */
  @Input() weekdayFormat?: 'narrow' | 'short' | 'long';
  /** Whether the popup calendar is open */
  @Input() open?: boolean;
  /** The preferred popup placement */
  @Input() placement?:
    'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
  /** The distance in pixels between the popup and input */
  @Input() distance?: number;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() clearEvent = new EventEmitter<CustomEvent>();
  @Output() showEvent = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hideEvent = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();
  @Output() invalid = new EventEmitter<CustomEvent>();

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

    const handleInputEvent = (e: Event) =>
      this.inputEvent.emit(e as InputEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleChange = (e: Event) => this.change.emit(e as Event);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as FocusEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleClearEvent = (e: Event) =>
      this.clearEvent.emit(e as CustomEvent);
    el.addEventListener('wa-clear', handleClearEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-clear', handleClearEvent)
    );
    const handleShowEvent = (e: Event) => this.showEvent.emit(e as CustomEvent);
    el.addEventListener('wa-show', handleShowEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-show', handleShowEvent)
    );
    const handleAfterShow = (e: Event) => this.afterShow.emit(e as CustomEvent);
    el.addEventListener('wa-after-show', handleAfterShow);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-show', handleAfterShow)
    );
    const handleHideEvent = (e: Event) => this.hideEvent.emit(e as CustomEvent);
    el.addEventListener('wa-hide', handleHideEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-hide', handleHideEvent)
    );
    const handleAfterHide = (e: Event) => this.afterHide.emit(e as CustomEvent);
    el.addEventListener('wa-after-hide', handleAfterHide);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-hide', handleAfterHide)
    );
    const handleInvalid = (e: Event) => this.invalid.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() =>
      el.removeEventListener('wa-invalid', handleInvalid)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  focus(options?: FocusOptions): void {
    (
      this.elementRef.nativeElement as unknown as {
        focus: (options?: FocusOptions) => void;
      }
    ).focus(options);
  }
  blur(): void {
    (this.elementRef.nativeElement as unknown as { blur: () => void }).blur();
  }
  show(): void {
    (this.elementRef.nativeElement as unknown as { show: () => void }).show();
  }
  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
  }
  clear(): void {
    (this.elementRef.nativeElement as unknown as { clear: () => void }).clear();
  }
  formStateRestoreCallback(state?: string | File | FormData | null): void {
    (
      this.elementRef.nativeElement as unknown as {
        formStateRestoreCallback: (
          state?: string | File | FormData | null
        ) => void;
      }
    ).formStateRestoreCallback(state);
  }
  setCustomValidity(message?: string): void {
    (
      this.elementRef.nativeElement as unknown as {
        setCustomValidity: (message?: string) => void;
      }
    ).setCustomValidity(message);
  }
  resetValidity(): void {
    (
      this.elementRef.nativeElement as unknown as { resetValidity: () => void }
    ).resetValidity();
  }
}
