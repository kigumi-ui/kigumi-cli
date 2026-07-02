import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoPlaylistComponent } from './video-playlist.component';

describe('VideoPlaylistComponent', () => {
  let component: VideoPlaylistComponent;
  let fixture: ComponentFixture<VideoPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoPlaylistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('wa-video-playlist');
    expect(el).toBeTruthy();
  });
});
