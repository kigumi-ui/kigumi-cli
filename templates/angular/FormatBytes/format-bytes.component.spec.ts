import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormatBytesComponent } from './format-bytes.component';

describe('FormatBytesComponent', () => {
  let component: FormatBytesComponent;
  let fixture: ComponentFixture<FormatBytesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormatBytesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormatBytesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-format-bytes');
    expect(el).toBeTruthy();
  });
});
