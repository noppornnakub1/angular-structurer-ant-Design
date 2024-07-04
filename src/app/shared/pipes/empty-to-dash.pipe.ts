import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'nullOrEmptyToDash'
})
export class NullOrEmptyToDashPipe implements PipeTransform {
    transform(value: any): any {
        if (value === null || value === '') {
            return '-';
        }
        return value;
    }
}
