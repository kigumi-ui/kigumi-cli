import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncludeComponent } from './include.component';

describe('IncludeComponent', () => {
  let component: IncludeComponent;
  let fixture: ComponentFixture<IncludeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncludeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IncludeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-include');
    expect(el).toBeTruthy();
  });
});
