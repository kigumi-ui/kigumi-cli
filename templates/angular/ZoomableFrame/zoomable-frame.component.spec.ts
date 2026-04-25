import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoomableFrameComponent } from './zoomable-frame.component';

describe('ZoomableFrameComponent', () => {
  let component: ZoomableFrameComponent;
  let fixture: ComponentFixture<ZoomableFrameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomableFrameComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoomableFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-zoomable-frame');
    expect(el).toBeTruthy();
  });
});
