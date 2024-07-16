
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { ISupplier } from '../interface/supplier.interface';
import { IsupplierType } from '../interface/supplierType.interface';

@Injectable({
    providedIn: 'root'
  })
  export class SupplierService {

    constructor(private _http: HttpClient) { }
    
    getData() {
      return this._http.get(`/Supplier/SupplierInfo`);
    }

    addData(supplier: any): Observable<any> {
      return this._http.post(`/Supplier/AddSupplier`, supplier);
    }
    findSupplierById(id: number): Observable<ISupplier> {
      return this._http.get<ISupplier>(`/Supplier/FindSupplierByID?id=${id}`);
    }
  
    updateData(id: number, data: ISupplier): Observable<any> {
      return this._http.put(`/Supplier/UpdateSupplier?id=${id}`, data);
    }

    findSupplierTypeById(id: number): Observable<IsupplierType> {
      return this._http.get<IsupplierType>(`/Supplier/FindSupplierTypeByID?id=${id}`);
    }
  
    getSupplierType() {
      return this._http.get(`/Supplier/GetSupplierType`);
    }

    addSupplierBank(supplierbank: any): Observable<any> {
      return this._http.post(`/SupplierBank/AddSupplierBank`, supplierbank);
    }

    getTopSupplierByType(supplier_type: string): Observable<{ supplier_num: string, code_from: string }> {
      return this._http.get<{ supplier_num: string, code_from: string }>(`/Supplier/FindSupplierByTypeName?supplierType=${supplier_type}`)
        .pipe(
          catchError(error => {
            if (error.status === 404) {
              return of({ supplier_num: '000', code_from: '' }); // ในกรณีที่ไม่พบข้อมูลให้ return ค่า default
            } else {
              throw error;
            }
          })
        );
    }

  }