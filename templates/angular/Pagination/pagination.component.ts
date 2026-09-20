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
import type WaElement from '@awesome.me/webawesome/dist/components/pagination/pagination.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/pagination/pagination.js'));
}

/**
 * Pagination splits long lists of content into pages, letting users navigate between them
 *
 * @see https://webawesome.com/docs/components/pagination
 */
@Component({
  selector: 'k-pagination',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-pagination
      #element
      [attr.total]="total"
      [attr.page-size]="pageSize"
      [attr.page]="page"
      [attr.sibling-count]="siblingCount"
      [attr.boundary-count]="boundaryCount"
      [attr.without-nav]="withoutNav || null"
      [attr.with-edges]="withEdges || null"
      [attr.with-summary]="withSummary || null"
      [attr.format]="format"
      [attr.href-template]="hrefTemplate"
      [attr.hide-single-page]="hideSinglePage || null"
      [attr.label]="label"
      [attr.appearance]="appearance"
      [attr.disabled]="disabled || null"
    >
      <ng-content />
    </wa-pagination>
  `,
  styleUrl: './pagination.component.css',
})
export class PaginationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** The total number of items to paginate */
  @Input() total?: number;
  /** The number of items shown per page */
  @Input() pageSize?: number;
  /** The current page, starting at 1 */
  @Input() page?: number;
  /** The number of pages to show on each side of the current page */
  @Input() siblingCount?: number;
  /** The number of pages to always show at the start and end */
  @Input() boundaryCount?: number;
  /** Hides the previous and next buttons */
  @Input() withoutNav?: boolean;
  /** Shows buttons that jump to the first and last pages */
  @Input() withEdges?: boolean;
  /** Shows a summary of the items on the current page */
  @Input() withSummary?: boolean;
  /** The pagination layout */
  @Input() format?: 'standard' | 'compact';
  /** URL template with {page} placeholder to render page items as links */
  @Input() hrefTemplate?: string;
  /** Renders nothing when there is only one page */
  @Input() hideSinglePage?: boolean;
  /** Accessible name announced by screen readers */
  @Input() label?: string;
  /** Visual appearance */
  @Input() appearance?: 'outlined' | 'filled' | 'plain';
  /** Disables the pagination */
  @Input() disabled?: boolean;

  @Output() beforePageChange = new EventEmitter<CustomEvent>();
  @Output() pageChange = new EventEmitter<CustomEvent>();

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

    const handleBeforePageChange = (e: Event) =>
      this.beforePageChange.emit(e as CustomEvent);
    el.addEventListener('wa-before-page-change', handleBeforePageChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-before-page-change', handleBeforePageChange)
    );
    const handlePageChange = (e: Event) =>
      this.pageChange.emit(e as CustomEvent);
    el.addEventListener('wa-page-change', handlePageChange);
    this.cleanups.push(() =>
      el.removeEventListener('wa-page-change', handlePageChange)
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}
