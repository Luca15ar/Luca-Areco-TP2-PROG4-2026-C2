import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  @Input('appImageFallback') customFallback?: string;

  private static readonly DEFAULT_FALLBACK =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23fb7185" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

  private hasFailed = false;

  constructor(private readonly elementRef: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError(): void {
    if (this.hasFailed) return;
    this.hasFailed = true;

    const img = this.elementRef.nativeElement;
    img.src = this.customFallback || ImageFallbackDirective.DEFAULT_FALLBACK;
    img.classList.add('image-fallback-active');
  }
}
