import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import type WaElement from '@awesome.me/webawesome/dist/components/markdown/markdown.js';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/markdown/markdown.js'));
}

/**
 * Renders markdown content in plain HTML
 *
 * @see https://webawesome.com/docs/components/markdown
 */
@Component({
  selector: 'k-markdown',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <wa-markdown
        #element
        [attr.tab-size]="tabSize">
      <ng-content />
    </wa-markdown>
  `,
  styleUrl: './markdown.component.css',
})
export class MarkdownComponent implements AfterViewInit {
  @ViewChild('element') elementRef!: ElementRef<WaElement>;
  private hostRef = inject(ElementRef<HTMLElement>);

  /** Tab stop width for whitespace normalization */
  @Input() tabSize?: number;

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

  getMarked(): void {
    (this.elementRef.nativeElement as unknown as { getMarked: () => void }).getMarked();
  }
  updateAll(): void {
    (this.elementRef.nativeElement as unknown as { updateAll: () => void }).updateAll();
  }
  renderMarkdown(): void {
    (this.elementRef.nativeElement as unknown as { renderMarkdown: () => void }).renderMarkdown();
  }
}
