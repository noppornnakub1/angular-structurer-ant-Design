import { Directive, Input } from '@angular/core';
import { Validator, NG_VALIDATORS, AbstractControl, ValidationErrors, Validators, FormControl } from '@angular/forms';

@Directive({
    selector: '[appPhoneValidator]',
    providers: [{ provide: NG_VALIDATORS, useExisting: PhoneValidatorDirective, multi: true }]
})
export class PhoneValidatorDirective implements Validator {
    @Input() appPhoneValidator: boolean = true;

    validate(control: AbstractControl): ValidationErrors | null {
        if (!this.appPhoneValidator) {
            return null;
        }

        const value: string = control.value;
        if (!value) {
            return null;
        }

        // Step 1: Check if input contains only numbers
        const numberPattern = /^[0-9]*$/;
        if (!numberPattern.test(value)) {
            return { 'invalidNumberFormat': true };
        }

        // Step 2: Check if input has exactly 10 digits
        if (value.length !== 10) {
            return { 'invalidLength': true };
        }

        return null;
    }
}
