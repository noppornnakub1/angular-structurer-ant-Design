import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appOnlyNumberAndDigitValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: OnlyNumberAndDigitValidatorDirective, multi: true }]
})
export class OnlyNumberAndDigitValidatorDirective implements Validator {
  @Input() maxDigits: number = 10; // Default maximum digits

  validate(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value;
    if (!value) {
      return null;
    }

    const numberPattern = /^[0-9]+$/; // Regular expression to allow only numbers
    if (!numberPattern.test(value)) {
      return { 'invalidNumberFormat': true };
    }

    if (value.length != this.maxDigits) {
      return { 'exactDigitsRequired': true };
    }

    return null;
  }
}