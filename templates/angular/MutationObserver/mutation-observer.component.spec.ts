import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MutationObserverComponent } from './mutation-observer.component';

describe('MutationObserverComponent', () => {
  let component: MutationObserverComponent;
  let fixture: ComponentFixture<MutationObserverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MutationObserverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MutationObserverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-mutation-observer');
    expect(el).toBeTruthy();
  });
});
