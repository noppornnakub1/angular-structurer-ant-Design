import { Directive, Input } from '@angular/core';
import { Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[appNumberValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: NumberValidatorDirective, multi: true }]
})
export class NumberValidatorDirective implements Validator {
  @Input() appNumberValidator: boolean = true;

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

    return null;
  }
}
