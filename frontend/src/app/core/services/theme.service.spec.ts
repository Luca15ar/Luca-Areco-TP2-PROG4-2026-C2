import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe alternar el tema entre dark y light', () => {
    const initial = service.currentTheme();
    service.toggleTheme();
    expect(service.currentTheme()).toBe(initial === 'dark' ? 'light' : 'dark');
  });
});

