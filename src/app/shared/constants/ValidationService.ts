import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  validateTaxId(input: string, Type: string): string {
    let startsWithHyphen = input.startsWith('-');
  
    // ดึงเฉพาะตัวเลขออกมา
    let numericValue = input.replace(/[^0-9]/g, '');
  
    // ถ้าขึ้นต้นด้วย "-" ให้คืนค่าแค่ "-"
    if (startsWithHyphen) {
      return '-';
    }
  
    // ✅ จำกัดความยาว 13 ตัวอักษร ถ้า supplierType เป็นเงื่อนไขที่กำหนด
    const fixedLengthTypes = ['LOCL', '2A', 'ARTS', '2K'];
    if (fixedLengthTypes.includes(Type)) {
      numericValue = numericValue.substring(0, 13);
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

  preventThaiInput(event: KeyboardEvent) {
    const thaiCharacterPattern = /[ก-๙]/;
    if (thaiCharacterPattern.test(event.key)) {
      event.preventDefault(); // ❌ ไม่ให้พิมพ์ตัวอักษรไทย
    }
  }
}