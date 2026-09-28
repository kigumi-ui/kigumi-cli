import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
  Input,
} from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/qr-code/qr-code.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/qr-code/qr-code.js'));
}

/**
 * Generates QR codes for encoding text, URLs, or data
 *
 * @see https://webawesome.com/docs/components/qr-code
 */
@Component({
  selector: 'k-qr-code',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-qr-code
      #element
      [attr.value]="value"
      [attr.label]="label"
      [attr.size]="size"
      [attr.fill]="fill"
      [attr.background]="background"
      [attr.radius]="radius"
      [attr.error-correction]="errorCorrection"
      [attr.image]="image"
      [attr.image-background]="imageBackground"
      [attr.image-coverage]="imageCoverage"
    >
      <ng-content />
    </wa-qr-code>
  `,
  styleUrl: './qr-code.component.css',
})
export class QrCodeComponent implements AfterViewInit {
  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The data to encode */
  @Input() value?: string;
  /** Accessible label */
  @Input() label?: string;
  /** Size in pixels */
  @Input() size?: number;
  /**
   * Fill color
   *
   * @deprecated Set the CSS color property on the QR code instead.
   */
  @Input() fill?: string;
  /**
   * Background color
   *
   * @deprecated Set the CSS background-color property on the QR code instead.
   */
  @Input() background?: string;
  /** Corner radius */
  @Input() radius?: number;
  /** Error correction level */
  @Input() errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  /** URL or data URI of an image, such as a logo, drawn in the centre of the code */
  @Input() image?: string;
  /** Colour filled behind the centre image, so the code does not show through a transparent one */
  @Input() imageBackground?: string;
  /** Share of the code's error-correction capacity the centre image may take, from 0 to 1 (0.5 when unset); higher values scan less reliably */
  @Input() imageCoverage?: number;

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
