import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/checkbox-group/checkbox-group.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/checkbox-group/checkbox-group.js'));
}

/**
 * Checkbox groups label and group a set of checkboxes so they share hint text and validation
 *
 * @see https://webawesome.com/docs/components/checkbox-group
 */
@Component({
  selector: 'k-checkbox-group',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-checkbox-group
      #element
      [attr.label]="label"
      [attr.hint]="hint"
      [attr.orientation]="orientation"
      [attr.size]="size"
      [attr.required]="required || null"
      [attr.with-label]="withLabel || null"
      [attr.with-hint]="withHint || null"
    >
      <ng-content />
    </wa-checkbox-group>
  `,
  styleUrl: './checkbox-group.component.css',
})
export class CheckboxGroupComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Group label */
  @Input() label?: string;
  /** Hint text shown below the label */
  @Input() hint?: string;
  /** Layout direction of the grouped checkboxes */
  @Input() orientation?: 'horizontal' | 'vertical';
  /** Size applied to all checkboxes in the group */
  @Input() size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';
  /** Requires at least one option to be selected */
  @Input() required?: boolean;
  /** Only required for SSR. Renders the label slot on the server */
  @Input() withLabel?: boolean;
  /** Only required for SSR. Renders the hint slot on the server */
  @Input() withHint?: boolean;

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
  }
}
