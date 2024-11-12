
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { CustomerSupplier, DataOld, ICustomer } from '../interface/customer.interface';
import { ICustomerType } from '../interface/customerType.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(private _http: HttpClient) { }

  getData() {
    return this._http.get(`/Customer/CustomerInfo`);
  }

  addDataWithFile(customer: any, file?: File): Observable<any> {
    const formData = new FormData();

    Object.keys(customer).forEach(key => {
      formData.append(key, customer[key]);
    });

    if (file) {
      formData.append('file', file);
    }

    return this._http.post(`/Customer/AddCustomer`, formData);
  }

  findCustomerById(id: number): Observable<ICustomer> {
    return this._http.get<ICustomer>(`/Customer/FindCustomerByID?id=${id}`);
  }

  updateData(id: number, data: ICustomer): Observable<any> {
    return this._http.put(`/Customer/UpdateCustomer?id=${id}`, data);
  }

  findCustomerTypeById(id: number): Observable<ICustomerType> {
    return this._http.get<ICustomerType>(`/Customer/FindCustomerTypeByID?id=${id}`);
  }

  getCustomerType() {
    return this._http.get(`/Customer/GetCustomerType`);
  }

  insertLog(log: any): Observable<any> {
    return this._http.post(`/EventLog/InsertLog`, log);
  }

  getLog(customerId: number): Observable<any[]> {
    return this._http.get<any[]>(`/EventLog/FindLogByCustomnerID?customerId=${customerId}`);
  }

  getDataByTaxId(taxId: string): Observable<any> {
    return this._http.get<any>(`/Customer/GetDataByTaxId?taxId=${taxId}`);
  }

  findDataByUserId(id: number): Observable<ICustomer> {
    return this._http.get<ICustomer>(`/Customer/FindDataByUserID?userid=${id}`);
  }
  findDataByUserCompanyACC(company: string): Observable<ICustomer> {
    return this._http.get<ICustomer>(`/Customer/GetDataByUserCompanyACC?company=${company}`);
  }

  findDataByUserCompanyFN(company: string): Observable<ICustomer> {
    return this._http.get<ICustomer>(`/Customer/GetDataByUserCompanyFN?company=${company}`);
  }

  findApproversByCompany(company: string): Observable<any> {
    return this._http.get(`/User/findApproversByCompany?company=${company}`);
  }

  findDataOldCustomer(num?: string, name?: string, site?: string): Observable<DataOld> {
    // สร้าง query string ตามพารามิเตอร์ที่มีค่า
    let params = new HttpParams();

    if (num) {
      params = params.set('num', num);
    }
    if (name) {
      params = params.set('name', name);
    }
    if (site) {
      params = params.set('site', site);
    }

    // ส่ง request ไปยัง backend พร้อมพารามิเตอร์
    return this._http.get<DataOld>('/BankMasterData/KEY_CUSTOMER', { params });
  }

  findDataOldSupplier(num?: string, name?: string, tax?: string): Observable<DataOld> {
    // สร้าง query string ตามพารามิเตอร์ที่มีค่า
    let params = new HttpParams();

    if (num) {
      params = params.set('num', num);
    }
    if (name) {
      params = params.set('name', name);
    }
    if (tax) {
      params = params.set('tax', tax);
    }

    return this._http.get<DataOld>('/BankMasterData/KEY_SUPPLIER', { params });
  }

  GetNumMaxCustomer(num: string): Observable<any> {
    return this._http.get(`/TempNumKey/findbyKey/${num}`);
  }

  getCustomerSupplierHistory(id?: number, company?: string, status?: string, ownerType?: string): Observable<CustomerSupplier> {
    const params = new HttpParams({
      fromObject: {
        userid: id?.toString() || '',
        company: company || '',
        status: status || '',
        ownerType: ownerType || ''
      }
    });

    return this._http.get<CustomerSupplier>('/Customer/GetCustomerSupplierHistory', { params });
  }

  uploadFile(file: any): Observable<any> {
    return this._http.post(`/Customer/upload`, file);
  }


  CheckDuplicateSCustomerByConpanySiteAndName(formData: any): Observable<any> {
    return this._http.post(`/Customer/CheckDuplicateCustomer`, formData, { responseType: 'text' });
  }
}