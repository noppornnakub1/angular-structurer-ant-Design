import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appOnlyNumber]'
})
export class OnlyNumberDigitDirective {
  @Input() maxDigits: number = 10; // Default maximum digits

  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event']) onInput(event: any) {
    const initialValue = this.el.nativeElement.value;
    const digitsOnly = initialValue.replace(/\D/g, ''); // Remove non-numeric characters

    if (digitsOnly.length > this.maxDigits) {
      this.el.nativeElement.value = digitsOnly.slice(0, this.maxDigits); // Trim to max digits
    } else {
      this.el.nativeElement.value = digitsOnly;
    }

    if (initialValue !== this.el.nativeElement.value) {
      event.stopPropagation(); // Stop the event propagation if the value was modified
    }
  }
}
