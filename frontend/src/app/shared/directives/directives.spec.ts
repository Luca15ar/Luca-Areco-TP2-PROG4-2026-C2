import { describe, expect, it, vi } from 'vitest';
import { ElementRef } from '@angular/core';
import { ClickOutsideDirective } from './click-outside.directive';
import { AutofocusDirective } from './autofocus.directive';
import { ImageFallbackDirective } from './image-fallback.directive';

describe('Custom Directives', () => {
  describe('ClickOutsideDirective', () => {
    it('debe emitir clickOutside cuando el clic ocurre fuera del elemento', () => {
      const hostEl = document.createElement('div');
      const outsideEl = document.createElement('button');
      document.body.appendChild(hostEl);
      document.body.appendChild(outsideEl);

      const directive = new ClickOutsideDirective(new ElementRef(hostEl));
      const spy = vi.fn();
      directive.clickOutside.subscribe(spy);

      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: outsideEl });

      directive.onClick(event);
      expect(spy).toHaveBeenCalled();

      hostEl.remove();
      outsideEl.remove();
    });

    it('no debe emitir cuando el clic ocurre dentro del elemento', () => {
      const hostEl = document.createElement('div');
      const childEl = document.createElement('span');
      hostEl.appendChild(childEl);
      document.body.appendChild(hostEl);

      const directive = new ClickOutsideDirective(new ElementRef(hostEl));
      const spy = vi.fn();
      directive.clickOutside.subscribe(spy);

      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: childEl });

      directive.onClick(event);
      expect(spy).not.toHaveBeenCalled();

      hostEl.remove();
    });
  });

  describe('AutofocusDirective', () => {
    it('debe llamar a focus si shouldFocus es true', async () => {
      const inputEl = document.createElement('input');
      const spy = vi.spyOn(inputEl, 'focus');

      const directive = new AutofocusDirective(new ElementRef(inputEl));
      directive.shouldFocus = true;
      directive.ngAfterViewInit();

      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('ImageFallbackDirective', () => {
    it('debe cambiar src a fallback cuando ocurre un error en la imagen', () => {
      const imgEl = document.createElement('img');
      imgEl.src = 'https://broken-image.com/fake.jpg';

      const directive = new ImageFallbackDirective(new ElementRef(imgEl));
      directive.customFallback = 'fallback.png';
      directive.onError();

      expect(imgEl.src).toContain('fallback.png');
      expect(imgEl.classList.contains('image-fallback-active')).toBe(true);
    });
  });
});
