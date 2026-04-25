import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PolarAreaChartComponent } from './polar-area-chart.component';

describe('PolarAreaChartComponent', () => {
  let component: PolarAreaChartComponent;
  let fixture: ComponentFixture<PolarAreaChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolarAreaChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PolarAreaChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-polar-area-chart');
    expect(el).toBeTruthy();
  });
});
