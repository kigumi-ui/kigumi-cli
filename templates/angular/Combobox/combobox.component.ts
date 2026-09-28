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
import type WaElement from '@awesome.me/webawesome/dist/components/combobox/combobox.js';
import type { WaAfterHideEvent } from '@awesome.me/webawesome/dist/events/after-hide.js';
import type { WaAfterShowEvent } from '@awesome.me/webawesome/dist/events/after-show.js';
import type { WaClearEvent } from '@awesome.me/webawesome/dist/events/clear.js';
import type { WaCreateEvent } from '@awesome.me/webawesome/dist/events/create.js';
import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome/dist/events/invalid.js';
import type { WaOptionsErrorEvent } from '@awesome.me/webawesome/dist/events/options-error.js';
import type { WaOptionsRequestEvent } from '@awesome.me/webawesome/dist/events/options-request.js';
import type { WaShowEvent } from '@awesome.me/webawesome/dist/events/show.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/combobox/combobox.js'));
}

/**
 * Combines a text input with a listbox for filtering and selecting options
 *
 * @see https://webawesome.com/docs/components/combobox
 */
@Component({
  selector: 'k-combobox',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-combobox
      #element
      [attr.allow-custom-value]="allowCustomValue || null"
      [attr.appearance]="appearance"
      [attr.allow-create]="allowCreate || null"
      [attr.autocapitalize]="autocapitalize"
      [attr.autocorrect]="
        autocorrect == null ? null : autocorrect ? 'on' : 'off'
      "
      [attr.disabled]="disabled || null"
      [attr.enterkeyhint]="enterkeyhint"
      [attr.hint]="hint"
      [attr.inputmode]="inputmode"
      [attr.label]="label"
      [attr.max-options-visible]="maxOptionsVisible"
      [attr.multiple]="multiple || null"
      [attr.name]="name"
      [attr.open]="open || null"
      [attr.pill]="pill || null"
      [attr.placeholder]="placeholder"
      [attr.placement]="placement"
      [attr.required]="required || null"
      [attr.size]="size"
      [attr.spellcheck]="
        spellcheck == null ? null : spellcheck ? 'true' : 'false'
      "
      [attr.with-clear]="withClear || null"
      [attr.value]="value"
      [attr.custom-error]="customError"
      [attr.server]="server || null"
      [attr.loading]="loading || null"
      [attr.filter-debounce]="filterDebounce"
    >
      <ng-content />
    </wa-combobox>
  `,
  styleUrl: './combobox.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboboxComponent),
      multi: true,
    },
  ],
})
export class ComboboxComponent
  implements AfterViewInit, OnDestroy, ControlValueAccessor
{
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Allows entering custom values */
  @Input() allowCustomValue?: boolean;
  /** Visual appearance style */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** Allows creating new options not in the list */
  @Input() allowCreate?: boolean;
  /** Controls autocapitalization on supported devices */
  @Input() autocapitalize?:
    'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
  /** Turns autocorrect on or off; the browser decides when unset */
  @Input() autocorrect?: boolean;
  /** Disables the combobox */
  @Input() disabled?: boolean;
  /** Customizes the keyboard's Enter key label */
  @Input() enterkeyhint?:
    'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  /** Hint text */
  @Input() hint?: string;
  /** Controls virtual keyboard type */
  @Input() inputmode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';
  /** Label text */
  @Input() label?: string;
  /** Maximum visible options before scrolling */
  @Input() maxOptionsVisible?: number;
  /** Allows multiple selections */
  @Input() multiple?: boolean;
  /** Form field name */
  @Input() name?: string;
  /** Whether the listbox is open */
  @Input() open?: boolean;
  /** Rounded edges style */
  @Input() pill?: boolean;
  /** Placeholder text */
  @Input() placeholder?: string;
  /** Listbox placement */
  @Input() placement?: 'top' | 'bottom';
  /** Makes field mandatory */
  @Input() required?: boolean;
  /** Combobox size */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Turns spell checking on or off; on when unset */
  @Input() spellcheck?: boolean;
  /** Shows clear button */
  @Input() withClear?: boolean;
  /** Current value of the combobox */
  @Input() value?: string;
  /** Custom validation message; the control is invalid while it is set */
  @Input() customError?: string;
  /** Turns off client-side filtering; swap the options yourself on options-request */
  @Input() server?: boolean;
  /** Whether an options request is pending; reset it once new options are in */
  @Input() loading?: boolean;
  /** Milliseconds of typing pause before options are requested in server mode */
  @Input() filterDebounce?: number;

  @Output() inputEvent = new EventEmitter<InputEvent>();
  @Output() change = new EventEmitter<Event>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<FocusEvent>();
  @Output() clear = new EventEmitter<WaClearEvent>();
  @Output() showEvent = new EventEmitter<WaShowEvent>();
  @Output() afterShow = new EventEmitter<WaAfterShowEvent>();
  @Output() hideEvent = new EventEmitter<WaHideEvent>();
  @Output() afterHide = new EventEmitter<WaAfterHideEvent>();
  @Output() create = new EventEmitter<WaCreateEvent>();
  @Output() invalid = new EventEmitter<WaInvalidEvent>();
  @Output() optionsRequest = new EventEmitter<WaOptionsRequestEvent>();
  @Output() optionsError = new EventEmitter<WaOptionsErrorEvent>();

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
    const handleChange = (e: Event) => this.change.emit(e);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as FocusEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleClear = (e: Event) => this.clear.emit(e as WaClearEvent);
    el.addEventListener('wa-clear', handleClear);
    this.cleanups.push(() => el.removeEventListener('wa-clear', handleClear));
    const handleShowEvent = (e: Event) => this.showEvent.emit(e as WaShowEvent);
    el.addEventListener('wa-show', handleShowEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-show', handleShowEvent)
    );
    const handleAfterShow = (e: Event) =>
      this.afterShow.emit(e as WaAfterShowEvent);
    el.addEventListener('wa-after-show', handleAfterShow);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-show', handleAfterShow)
    );
    const handleHideEvent = (e: Event) => this.hideEvent.emit(e as WaHideEvent);
    el.addEventListener('wa-hide', handleHideEvent);
    this.cleanups.push(() =>
      el.removeEventListener('wa-hide', handleHideEvent)
    );
    const handleAfterHide = (e: Event) =>
      this.afterHide.emit(e as WaAfterHideEvent);
    el.addEventListener('wa-after-hide', handleAfterHide);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-hide', handleAfterHide)
    );
    const handleCreate = (e: Event) => this.create.emit(e as WaCreateEvent);
    el.addEventListener('wa-create', handleCreate);
    this.cleanups.push(() => el.removeEventListener('wa-create', handleCreate));
    const handleInvalid = (e: Event) => this.invalid.emit(e as WaInvalidEvent);
    el.addEventListener('wa-invalid', handleInvalid);
    this.cleanups.push(() =>
      el.removeEventListener('wa-invalid', handleInvalid)
    );
    const handleOptionsRequest = (e: Event) =>
      this.optionsRequest.emit(e as WaOptionsRequestEvent);
    el.addEventListener('wa-options-request', handleOptionsRequest);
    this.cleanups.push(() =>
      el.removeEventListener('wa-options-request', handleOptionsRequest)
    );
    const handleOptionsError = (e: Event) =>
      this.optionsError.emit(e as WaOptionsErrorEvent);
    el.addEventListener('wa-options-error', handleOptionsError);
    this.cleanups.push(() =>
      el.removeEventListener('wa-options-error', handleOptionsError)
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

  reload(): void {
    (
      this.elementRef.nativeElement as unknown as { reload: () => void }
    ).reload();
  }
  show(): void {
    (this.elementRef.nativeElement as unknown as { show: () => void }).show();
  }
  hide(): void {
    (this.elementRef.nativeElement as unknown as { hide: () => void }).hide();
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
  setCustomValidity(message: string): void {
    (
      this.elementRef.nativeElement as unknown as {
        setCustomValidity: (message: string) => void;
      }
    ).setCustomValidity(message);
  }
  formStateRestoreCallback(
    state: string | File | FormData | null,
    reason: 'autocomplete' | 'restore'
  ): void {
    (
      this.elementRef.nativeElement as unknown as {
        formStateRestoreCallback: (
          state: string | File | FormData | null,
          reason: 'autocomplete' | 'restore'
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
