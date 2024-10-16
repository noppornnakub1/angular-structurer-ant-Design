import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  validateTaxId(input: string): string {
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    return numericValue;
  }

  validateTel(input: string): string {
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    return numericValue;
  }

  validateSite(input: string): string {
    // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
    const numericValue = input.replace(/\D/g, '');
    return numericValue;
  }
}