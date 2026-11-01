import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'trama_theme';
  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      if (typeof document !== 'undefined') {
        if (theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(this.THEME_KEY, theme);
      }
    });
  }

  toggleTheme(): void {
    this.currentTheme.update((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  private getInitialTheme(): Theme {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.THEME_KEY) as Theme;
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
    return 'dark';
  }
}

