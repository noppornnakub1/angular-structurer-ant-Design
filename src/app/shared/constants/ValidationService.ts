import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  validateTaxId(input: string): string {
    let startsWithHyphen = input.startsWith('-');

    let numericValue = input.replace(/[^0-9]/g, '');

    if (startsWithHyphen) {
      return '-';
    }
    
    return numericValue;
  }


  validateTel(input: string): string {
    let startsWithHyphen = input.startsWith('-');

    let numericValue = input.replace(/[^0-9]/g, '');

    numericValue = numericValue.slice(0, 10);

    if (startsWithHyphen) {
        return '-';
    }

    return numericValue;
}


  validateSite(input: string): string {
    // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
    const numericValue = input.replace(/\D/g, '');
    return numericValue;
  }
}