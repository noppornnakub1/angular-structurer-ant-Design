
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  }