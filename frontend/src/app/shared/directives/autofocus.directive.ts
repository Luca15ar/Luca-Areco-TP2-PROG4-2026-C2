import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  booleanAttribute,
} from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  @Input({ transform: booleanAttribute, alias: 'appAutofocus' })
  shouldFocus: boolean = true;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (this.shouldFocus) {
      setTimeout(() => {
        this.elementRef.nativeElement?.focus?.();
      }, 50);
    }
  }
}
