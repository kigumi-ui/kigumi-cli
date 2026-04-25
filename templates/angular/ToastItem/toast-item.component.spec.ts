import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastItemComponent } from './toast-item.component';

describe('ToastItemComponent', () => {
  let component: ToastItemComponent;
  let fixture: ComponentFixture<ToastItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-toast-item');
    expect(el).toBeTruthy();
  });
});
