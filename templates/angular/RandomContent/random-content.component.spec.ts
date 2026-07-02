import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RandomContentComponent } from './random-content.component';

describe('RandomContentComponent', () => {
  let component: RandomContentComponent;
  let fixture: ComponentFixture<RandomContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RandomContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-random-content');
    expect(el).toBeTruthy();
  });
});
