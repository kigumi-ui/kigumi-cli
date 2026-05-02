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
import type WaElement from '@awesome.me/webawesome/dist/components/comparison/comparison.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/comparison/comparison.js'));
}

/**
 * Compare visual differences between similar content with a sliding panel
 *
 * @see https://webawesome.com/docs/components/comparison
 */
@Component({
  selector: 'k-comparison',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-comparison #element [attr.position]="position">
      <ng-content />
    </wa-comparison>
  `,
  styleUrl: './comparison.component.css',
})
export class ComparisonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Divider location as percentage (0-100) */
  @Input() position?: number;

  @Output() change = new EventEmitter<CustomEvent>();

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

    const handleChange = (e: Event) => this.change.emit(e as CustomEvent);
    el.addEventListener('change', handleChange);
    this.cleanups.push(() => el.removeEventListener('change', handleChange));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
