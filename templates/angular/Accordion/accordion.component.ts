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
import type WaElement from '@awesome.me/webawesome/dist/components/accordion/accordion.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion/accordion.js'));
}

/**
 * Accordions group related disclosure panels and control how many can be open at once
 *
 * @see https://webawesome.com/docs/components/accordion
 */
@Component({
  selector: 'k-accordion',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-accordion
      #element
      [attr.mode]="mode"
      [attr.icon-placement]="iconPlacement"
      [attr.heading-level]="headingLevel"
      [attr.appearance]="appearance"
    >
      <ng-content />
    </wa-accordion>
  `,
  styleUrl: './accordion.component.css',
})
export class AccordionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Controls how many items can be expanded at once. `single` keeps one open, `single-collapsible` allows all to be closed, `multiple` allows any number open. */
  @Input() mode?: 'single' | 'single-collapsible' | 'multiple';
  /** Where the expand/collapse icon is placed on each item */
  @Input() iconPlacement?: 'start' | 'end';
  /** The heading level applied to each item header for assistive technology */
  @Input() headingLevel?: string;
  /** The visual style of the accordion */
  @Input() appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';

  @Output() expand = new EventEmitter<CustomEvent>();
  @Output() afterExpand = new EventEmitter<CustomEvent>();
  @Output() collapse = new EventEmitter<CustomEvent>();
  @Output() afterCollapse = new EventEmitter<CustomEvent>();

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

    const handleExpand = (e: Event) => this.expand.emit(e as CustomEvent);
    el.addEventListener('wa-expand', handleExpand);
    this.cleanups.push(() => el.removeEventListener('wa-expand', handleExpand));
    const handleAfterExpand = (e: Event) =>
      this.afterExpand.emit(e as CustomEvent);
    el.addEventListener('wa-after-expand', handleAfterExpand);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-expand', handleAfterExpand)
    );
    const handleCollapse = (e: Event) => this.collapse.emit(e as CustomEvent);
    el.addEventListener('wa-collapse', handleCollapse);
    this.cleanups.push(() =>
      el.removeEventListener('wa-collapse', handleCollapse)
    );
    const handleAfterCollapse = (e: Event) =>
      this.afterCollapse.emit(e as CustomEvent);
    el.addEventListener('wa-after-collapse', handleAfterCollapse);
    this.cleanups.push(() =>
      el.removeEventListener('wa-after-collapse', handleAfterCollapse)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }

  expandAll(): void {
    (
      this.elementRef.nativeElement as unknown as { expandAll: () => void }
    ).expandAll();
  }
  collapseAll(): void {
    (
      this.elementRef.nativeElement as unknown as { collapseAll: () => void }
    ).collapseAll();
  }
}
