import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormatShort'
})
export class NumberFormatShortPipe implements PipeTransform {

  transform(value: number): string {
    if (value === null || isNaN(value)) {
      return 'N/A';
    }

    if (value >= 1e6) {
      return (value / 1e6).toFixed(0) + 'M';
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(0) + 'K';
    } else {
      return value.toString();
    }
  }
}
