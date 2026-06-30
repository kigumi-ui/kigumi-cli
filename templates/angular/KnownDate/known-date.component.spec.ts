import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KnownDateComponent } from './known-date.component';

describe('KnownDateComponent', () => {
  let component: KnownDateComponent;
  let fixture: ComponentFixture<KnownDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnownDateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KnownDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-known-date');
    expect(el).toBeTruthy();
  });
});
