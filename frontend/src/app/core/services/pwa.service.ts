import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null;
  readonly canInstall = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const isStandalone =
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any)?.standalone === true;
      this.isInstalled.set(Boolean(isStandalone));

      window.addEventListener('beforeinstallprompt', (event: Event) => {
        event.preventDefault();
        this.deferredPrompt = event;
        this.canInstall.set(true);
      });

      window.addEventListener('appinstalled', () => {
        this.canInstall.set(false);
        this.isInstalled.set(true);
        this.deferredPrompt = null;
      });
    }
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.canInstall.set(false);
      this.deferredPrompt = null;
      return true;
    }
    return false;
  }
}
