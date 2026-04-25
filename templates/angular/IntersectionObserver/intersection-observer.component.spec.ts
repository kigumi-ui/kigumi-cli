import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntersectionObserverComponent } from './intersection-observer.component';

describe('IntersectionObserverComponent', () => {
  let component: IntersectionObserverComponent;
  let fixture: ComponentFixture<IntersectionObserverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntersectionObserverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntersectionObserverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-intersection-observer');
    expect(el).toBeTruthy();
  });
});
