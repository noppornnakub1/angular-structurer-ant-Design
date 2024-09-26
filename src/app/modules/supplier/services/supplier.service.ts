
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { ISupplier } from '../interface/supplier.interface';
import { IsupplierType } from '../interface/supplierType.interface';
import { DataBank } from '../pages/supplier-add/supplier-add.component';

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

    findSupplierBankBySupplierId(id: number): Observable<IsupplierType[]> {
      return this._http.get<IsupplierType[]>(`/SupplierBank/FindSupplierBankBySupplierID?supplierid=${id}`);
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

    addBankData(supplier: any): Observable<any> {
      return this._http.post(`/SupplierBank/AddSupplierBank`, supplier);
    }

    updateBankData(id: number, data: DataBank): Observable<any> {
      return this._http.put(`/SupplierBank/UpdateSupplierBank/${id}`, data);
    }

    insertLog(log: any): Observable<any> {
      return this._http.post(`/EventLog/InsertLog`, log);
    }

    getLog(supplierId: number):Observable<any[]>{
      return this._http.get<any[]>(`/EventLog/FindLogBySupplierID?supplierId=${supplierId}`);
    }

    getDataByTaxId(taxId: string): Observable<any> {
      return this._http.get<any>(`/Supplier/GetDataByTaxId?taxId=${taxId}`);
    }

    getDataPaymentMethod() {
      return this._http.get(`/Supplier/PaymentMethodInfo`);
    }

    getDataVat() {
      return this._http.get(`/Supplier/VatInfo`);
    }

    getDataCompany() {
      return this._http.get(`/Supplier/CompanyInfo`);
    }

    findDataByUserId(id: number): Observable<ISupplier> {
      return this._http.get<ISupplier>(`/Supplier/FindDataByUserID?userid=${id}`);
    }

    findDataByUserCompanyACC(company: string): Observable<ISupplier> {
      return this._http.get<ISupplier>(`/Supplier/GetDataByUserCompanyACC?company=${company}`);
    }

    findDataByUserCompanyFN(company: string): Observable<ISupplier> {
      return this._http.get<ISupplier>(`/Supplier/GetDataByUserCompanyFN?company=${company}`);
    }

    findApproversByCompany(company: string): Observable<any> {
      return this._http.get(`/User/findApproversByCompany?company=${company}`);
    }
    findApproversFNByCompany(company: string): Observable<any> {
      return this._http.get(`/User/findApproversFNByCompany?company=${company}`);
    }

    GetGroupNames(company: string): Observable<any> {
      return this._http.get(`/Supplier/GetGroupNames?company=${company}`);
    }

    CheckDupplicateSupplier(key: string): Observable<any> {
      return this._http.get(`/BankMasterData/CHECK_KEY_SUPPLIER?key=${key}`);
    }
    GetNumMaxSupplier(num: string): Observable<any> {
      return this._http.get(`/BankMasterData/Get_Num_KEY_SUPPLIER?num=${num}`);
    }
  }