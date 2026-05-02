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
      [attr.autocorrect]="autocorrect || null"
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
      [attr.spellcheck]="spellcheck || null"
      [attr.with-clear]="withClear || null"
      [attr.value]="value"
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
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Allows entering custom values */
  @Input() allowCustomValue?: boolean;
  /** Visual appearance style */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined';
  /** Allows creating new options not in the list */
  @Input() allowCreate?: boolean;
  /** Controls autocapitalization on supported devices */
  @Input() autocapitalize?:
    | 'off'
    | 'none'
    | 'on'
    | 'sentences'
    | 'words'
    | 'characters';
  /** Enable or disable autocorrect on supported devices */
  @Input() autocorrect?: boolean;
  /** Disables the combobox */
  @Input() disabled?: boolean;
  /** Customizes the keyboard's Enter key label */
  @Input() enterkeyhint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send';
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
  @Input() size?: 'small' | 'medium' | 'large';
  /** Enable or disable spellchecking */
  @Input() spellcheck?: boolean;
  /** Shows clear button */
  @Input() withClear?: boolean;
  /** Current value of the combobox */
  @Input() value?: string;

  @Output() inputEvent = new EventEmitter<CustomEvent>();
  @Output() change = new EventEmitter<CustomEvent>();
  @Output() focusEvent = new EventEmitter<FocusEvent>();
  @Output() blurEvent = new EventEmitter<CustomEvent>();
  @Output() clear = new EventEmitter<CustomEvent>();
  @Output() showEvent = new EventEmitter<CustomEvent>();
  @Output() afterShow = new EventEmitter<CustomEvent>();
  @Output() hideEvent = new EventEmitter<CustomEvent>();
  @Output() afterHide = new EventEmitter<CustomEvent>();
  @Output() create = new EventEmitter<CustomEvent>();
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
      this.inputEvent.emit(e as CustomEvent);
    el.addEventListener('input', handleInputEvent);
    this.cleanups.push(() => el.removeEventListener('input', handleInputEvent));
    const handleChange = (e: Event) => this.change.emit(e as CustomEvent);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
    const handleFocusEvent = (e: Event) =>
      this.focusEvent.emit(e as FocusEvent);
    el.addEventListener('focus', handleFocusEvent);
    this.cleanups.push(() => el.removeEventListener('focus', handleFocusEvent));
    const handleBlurEvent = (e: Event) => this.blurEvent.emit(e as CustomEvent);
    el.addEventListener('blur', handleBlurEvent);
    this.cleanups.push(() => el.removeEventListener('blur', handleBlurEvent));
    const handleClear = (e: Event) => this.clear.emit(e as CustomEvent);
    el.addEventListener('wa-clear', handleClear);
    this.cleanups.push(() => el.removeEventListener('wa-clear', handleClear));
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
    const handleCreate = (e: Event) => this.create.emit(e as CustomEvent);
    el.addEventListener('wa-create', handleCreate);
    this.cleanups.push(() => el.removeEventListener('wa-create', handleCreate));
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
