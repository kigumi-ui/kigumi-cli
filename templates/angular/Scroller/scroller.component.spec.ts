import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollerComponent } from './scroller.component';

describe('ScrollerComponent', () => {
  let component: ScrollerComponent;
  let fixture: ComponentFixture<ScrollerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-scroller');
    expect(el).toBeTruthy();
  });
});
