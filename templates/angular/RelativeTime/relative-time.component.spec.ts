import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelativeTimeComponent } from './relative-time.component';

describe('RelativeTimeComponent', () => {
  let component: RelativeTimeComponent;
  let fixture: ComponentFixture<RelativeTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelativeTimeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RelativeTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-relative-time');
    expect(el).toBeTruthy();
  });
});
