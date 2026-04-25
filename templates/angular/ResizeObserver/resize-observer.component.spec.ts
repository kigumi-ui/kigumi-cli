import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResizeObserverComponent } from './resize-observer.component';

describe('ResizeObserverComponent', () => {
  let component: ResizeObserverComponent;
  let fixture: ComponentFixture<ResizeObserverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeObserverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizeObserverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-resize-observer');
    expect(el).toBeTruthy();
  });
});
