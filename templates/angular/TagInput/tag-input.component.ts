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
  forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type WaElement from '@awesome.me/webawesome/dist/components/tag-input/tag-input.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tag-input/tag-input.js'));
}

/**
 * Tag inputs collect a list of short values, such as keywords or labels, as removable tags
 *
 * @see https://webawesome.com/docs/components/tag-input
 */
@Component({
  selector: 'k-tag-input',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-tag-input
      #element
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.value]="value"
      [attr.placeholder]="placeholder"
      [attr.delimiter]="delimiter"
      [attr.max-tags]="maxTags"
      [attr.min-tags]="minTags"
      [attr.allow-duplicates]="allowDuplicates || null"
      [attr.with-clear]="withClear || null"
      [attr.appearance]="appearance"
      [attr.size]="size"
      [attr.pill]="pill || null"
      [attr.required]="required || null"
      [attr.readonly]="readonly || null"
      [attr.disabled]="disabled || null"
      [attr.name]="name"
    >
      <ng-content />
    </wa-tag-input>
  `,
  styleUrl: './tag-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The tag input's label */
  @Input() label?: string;
  /** The tag input's hint */
  @Input() hint?: string;
  /** Default value as a delimiter-separated string */
  @Input() value?: string;
  /** Placeholder text shown in the text box */
  @Input() placeholder?: string;
  /** Characters that turn typed text into a tag */
  @Input() delimiter?: string;
  /** The maximum number of tags that can be added */
  @Input() maxTags?: number;
  /** The minimum number of tags required for the control to be valid */
  @Input() minTags?: number;
  /** Allows the same tag to be added more than once */
  @Input() allowDuplicates?: boolean;
  /** Adds a clear button that removes all tags */
  @Input() withClear?: boolean;
  /** Visual appearance */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** The tag input's size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Draws a pill-style tag input with rounded edges */
  @Input() pill?: boolean;
  /** Requires at least one tag */
  @Input() required?: boolean;
  /** Makes the tag input readonly */
  @Input() readonly?: boolean;
  /** Disables the form control */
  @Input() disabled?: boolean;
  /** The name of the input, submitted with form data */
  @Input() name?: string;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() create = new EventEmitter<CustomEvent>();
  @Output() clear = new EventEmitter<CustomEvent>();
  @Output() invalid = new EventEmitter<CustomEvent>();

  private onChangeCallback: (value: unknown) => void = () => {};
  private onTouchedCallback: () => void = () => {};

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
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as FocusEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleCreate = (e: Event) => this.create.emit(e as CustomEvent);
    el.addEventListener('wa-create', handleCreate);
    this.cleanups.push(() => el.removeEventListener('wa-create', handleCreate));
    const handleClear = (e: Event) => this.clear.emit(e as CustomEvent);
    el.addEventListener('wa-clear', handleClear);
    this.cleanups.push(() => el.removeEventListener('wa-clear', handleClear));
    const handleInvalid = (e: Event) => this.invalid.emit(e as CustomEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() =>
      el.removeEventListener('wa-invalid', handleInvalid)
    );

    const handleValueChange = () =>
      this.onChangeCallback((el as unknown as { value: unknown }).value);
    el.addEventListener('input', handleValueChange);
    this.cleanups.push(() =>
      el.removeEventListener('input', handleValueChange)
    );
    const handleBlurTouch = () => this.onTouchedCallback();
    el.addEventListener('blur', handleBlurTouch);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurTouch));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  writeValue(value: unknown): void {
    if (this.elementRef?.nativeElement) {
      (this.elementRef.nativeElement as unknown as { value: unknown }).value =
        value ?? '';
    }
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.elementRef?.nativeElement) {
      (
        this.elementRef.nativeElement as unknown as { disabled: boolean }
      ).disabled = isDisabled;
    }
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
  setCustomValidity(message?: string): void {
    (
      this.elementRef.nativeElement as unknown as {
        setCustomValidity: (message?: string) => void;
      }
    ).setCustomValidity(message);
  }
  formStateRestoreCallback(
    state?: string | File | FormData | null,
    reason?: 'autocomplete' | 'restore'
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        formStateRestoreCallback: (
          state?: string | File | FormData | null,
          reason?: 'autocomplete' | 'restore'
        ) => void;
      }
    ).formStateRestoreCallback(state, reason);
  }
  resetValidity(): void {
    (
      this.elementRef.nativeElement as unknown as { resetValidity: () => void }
    ).resetValidity();
  }
}
