import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormatNumberComponent } from './format-number.component';

describe('FormatNumberComponent', () => {
  let component: FormatNumberComponent;
  let fixture: ComponentFixture<FormatNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormatNumberComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormatNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-format-number');
    expect(el).toBeTruthy();
  });
});
