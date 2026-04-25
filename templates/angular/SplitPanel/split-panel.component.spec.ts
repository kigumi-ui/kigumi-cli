import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SplitPanelComponent } from './split-panel.component';

describe('SplitPanelComponent', () => {
  let component: SplitPanelComponent;
  let fixture: ComponentFixture<SplitPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-split-panel');
    expect(el).toBeTruthy();
  });
});
