import { Directive, Input } from '@angular/core';
import { Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[appPercentValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: PercentValidatorDirective, multi: true }]
})
export class PercentValidatorDirective implements Validator {
  @Input() appNumberValidator: boolean = true;
  @Input() minValue: number = 0;
  @Input() maxValue: number = 100;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.appNumberValidator) {
      return null;
    }

    const value: string = control.value;
    if (!value) {
      return null;
    }

    const numberPattern = /^[0-9]*$/;
    if (!numberPattern.test(value)) {
      return { 'invalidNumberFormat': true };
    }

    const parsedValue: number = parseInt(value, 10);
    if (parsedValue < this.minValue || parsedValue > this.maxValue) {
      return { 'outOfRange': true };
    }

    return null;
  }
}