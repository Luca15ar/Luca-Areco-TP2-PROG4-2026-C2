import { TestBed } from '@angular/core/testing';
import { PwaService } from './pwa.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.canInstall()).toBe(false);
  });

  it('debe retornar false en installApp si no hay un evento beforeinstallprompt diferido', async () => {
    const result = await service.installApp();
    expect(result).toBe(false);
  });

  it('debe solicitar el prompt nativo y actualizar canInstall cuando el usuario acepta la instalación', async () => {
    const promptSpy = vi.fn();
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: promptSpy,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), mockPromptEvent),
    );

    expect(service.canInstall()).toBe(true);

    const installed = await service.installApp();
    expect(promptSpy).toHaveBeenCalled();
    expect(installed).toBe(true);
    expect(service.canInstall()).toBe(false);
  });

  it('debe actualizar isInstalled al recibir el evento appinstalled', () => {
    window.dispatchEvent(new Event('appinstalled'));
    expect(service.isInstalled()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });
});
