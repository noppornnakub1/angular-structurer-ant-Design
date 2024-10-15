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

  addDataWithFiles(formData: FormData): Observable<any> {
    return this._http.post(`/Supplier/AddSupplierWithFiles`, formData);
  }

  findSupplierById(id: number): Observable<ISupplier> {
    return this._http.get<ISupplier>(`/Supplier/FindSupplierByID?id=${id}`);
  }

  findSupplierByIdV2(id: number): Observable<any> {
    return this._http.get(`/Supplier/FindSupplierByIDV2?id=${id}`);
  }

  updateData(id: number, data: ISupplier): Observable<any> {
    return this._http.put(`/Supplier/UpdateSupplier?id=${id}`, data);
  }

  updateDataWithFiles(id: number, formData: FormData): Observable<any> {
    // console.log("Sending FormData to API with ID:", id);
    // formData.forEach((value, key) => {
    //   console.log(`${key}:`, value);
    // });

    return this._http.put(`/Supplier/UpdateSupplierWithFiles?id=${id}`, formData);
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

  findSupplierBankBySupplierIdV2(id: number): Observable<any> {
    return this._http.get<any>(`/SupplierBank/FindSupplierBankBySupplierIDV2?supplierid=${id}`);
  }

  getTopSupplierByType(supplier_type: string): Observable<{ supplier_num: string, code_from: string }> {
    return this._http.get<{ supplier_num: string, code_from: string }>(`/Supplier/FindSupplierByTypeName?supplierType=${supplier_type}`)
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of({ supplier_num: '000', code_from: '' });
          } else {
            throw error;
          }
        })
      );
  }

  addBankData(supplier: any): Observable<any> {
    return this._http.post(`/SupplierBank/AddSupplierBank`, supplier);
  }

  addBankDataWithFiles(formData: FormData): Observable<any> {
    console.log("FormData before sending to API:");
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    return this._http.post(`/SupplierBank/AddSupplierBankWithFiles`, formData);
  }

  updateBankData(id: number, data: DataBank): Observable<any> {
    return this._http.put(`/SupplierBank/UpdateSupplierBank/${id}`, data);
  }

  updateBankDataWithFiles(id: number, formData: FormData): Observable<any> {
    return this._http.put(`/SupplierBank/UpdateSupplierBankWithFiles/${id}`, formData);
  }

  insertLog(log: any): Observable<any> {
    return this._http.post(`/EventLog/InsertLog`, log);
  }

  getLog(supplierId: number): Observable<any[]> {
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
    return this._http.get(`/TempNumKey/findbyKey/${num}`);
  }

  GetAllGroups() {
    return this._http.get(`/Supplier/GetAllGroups`);
  }
}