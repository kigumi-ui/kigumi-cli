import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormatDateComponent } from './format-date.component';

describe('FormatDateComponent', () => {
  let component: FormatDateComponent;
  let fixture: ComponentFixture<FormatDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormatDateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormatDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-format-date');
    expect(el).toBeTruthy();
  });
});
