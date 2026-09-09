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
import type WaElement from '@awesome.me/webawesome/dist/components/date-picker/date-picker.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/date-picker/date-picker.js'));
}

/**
 * An inline calendar for selecting a single date or a date range
 *
 * @see https://webawesome.com/docs/components/date-picker
 */
@Component({
  selector: 'k-date-picker',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-date-picker
      #element
      [attr.mode]="mode"
      [attr.value]="value"
      [attr.min]="min"
      [attr.max]="max"
      [attr.today]="today"
      [attr.focused-date]="focusedDate"
      [attr.view]="view"
      [attr.months]="months"
      [attr.page-by]="pageBy"
      [attr.first-day-of-week]="firstDayOfWeek"
      [attr.with-outside-days]="withOutsideDays || null"
      [attr.with-week-numbers]="withWeekNumbers || null"
      [attr.weekday-format]="weekdayFormat"
      [attr.disabled]="disabled || null"
      [attr.readonly]="readonly || null"
      [attr.disabled-dates]="disabledDates"
      [attr.disabled-days-of-week]="disabledDaysOfWeek"
      [attr.disable-past]="disablePast || null"
      [attr.disable-future]="disableFuture || null"
      [attr.min-range]="minRange"
      [attr.max-range]="maxRange"
      [attr.size]="size"
      [attr.locale]="locale"
    >
      <ng-content />
    </wa-date-picker>
  `,
  styleUrl: './date-picker.component.css',
})
export class DatePickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The selection mode */
  @Input() mode?: 'single' | 'range';
  /** The selected date(s) in ISO format */
  @Input() value?: string;
  /** The earliest selectable date (YYYY-MM-DD) */
  @Input() min?: string;
  /** The latest selectable date (YYYY-MM-DD) */
  @Input() max?: string;
  /** Overrides the date considered "today" */
  @Input() today?: string;
  /** The currently focused date */
  @Input() focusedDate?: string;
  /** The current calendar view */
  @Input() view?: 'months' | 'days' | 'years';
  /** The number of months rendered side-by-side */
  @Input() months?: '1' | '2';
  /** Whether prev/next advances by the visible range or one month */
  @Input() pageBy?: 'single' | 'months';
  /** The first day of the week */
  @Input() firstDayOfWeek?:
    'auto' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  /** Show leading/trailing days from adjacent months */
  @Input() withOutsideDays?: boolean;
  /** Show the ISO week-number column */
  @Input() withWeekNumbers?: boolean;
  /** The weekday header format */
  @Input() weekdayFormat?: 'narrow' | 'short' | 'long';
  /** Disables the entire picker */
  @Input() disabled?: boolean;
  /** Displays the value without allowing changes */
  @Input() readonly?: boolean;
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
  /** The visual size */
  @Input() size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  /** A BCP-47 locale override */
  @Input() locale?: string;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() focusDay = new EventEmitter<CustomEvent>();
  @Output() viewChange = new EventEmitter<CustomEvent>();

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
    const handleFocusDay = (e: Event) => this.focusDay.emit(e as CustomEvent);
    el.addEventListener('wa-focus-day', handleFocusDay);
    this.cleanups.push(() =>
      el.removeEventListener('wa-focus-day', handleFocusDay)
    );
    const handleViewChange = (e: Event) =>
      this.viewChange.emit(e as CustomEvent);
    el.addEventListener('wa-view-change', handleViewChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-view-change', handleViewChange)
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
  goToDate(date?: string | Date): void {
    (
      this.elementRef.nativeElement as unknown as {
        goToDate: (date?: string | Date) => void;
      }
    ).goToDate(date);
  }
  goToToday(): void {
    (
      this.elementRef.nativeElement as unknown as { goToToday: () => void }
    ).goToToday();
  }
  clear(): void {
    (this.elementRef.nativeElement as unknown as { clear: () => void }).clear();
  }
}
