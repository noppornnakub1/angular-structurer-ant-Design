
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

  addData(customer: any): Observable<any> {
    return this._http.post(`/Customer/AddCustomer`, customer);
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

  getTopCustomerByType(customerType: string): Observable<{ customer_num: string, code_from: string }> {
    return this._http.get<{ customer_num: string, code_from: string }>(`/Customer/FindCustomerByTypeName?customerType=${customerType}`)
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of({ customer_num: '000', code_from: '' }); // ในกรณีที่ไม่พบข้อมูลให้ return ค่า default
          } else {
            throw error;
          }
        })
      );
  }

  insertLog(log: any): Observable<any> {
    return this._http.post(`/EventLog/InsertLog`, log);
  }

  getLog(customerId: number):Observable<any[]>{
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

  findDataHistoryByUserId(id?: number, company?: string): Observable<CustomerSupplier> {
    // ตรวจสอบเงื่อนไขว่าเราจะส่งค่าอะไรบ้าง
    let params = '';
  
    if (id) {
      params += `?userid=${id}`;
    }
  
    if (company) {
      params += params ? `&company=${company}` : `?company=${company}`;
    }
  
    return this._http.get<CustomerSupplier>(`/Customer/FindDataHistoryByUserID${params}`);
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
      params = params.set('tax', tax); // กำหนดชื่อพารามิเตอร์ให้ตรงกับใน backend
    }
  
    // ส่ง request ไปยัง backend พร้อมพารามิเตอร์
    return this._http.get<DataOld>('/BankMasterData/KEY_SUPPLIER', { params });
  }

  CheckDupplicateCustomer(key: string): Observable<any> {
    return this._http.get(`/BankMasterData/CHECK_KEY_CUSTOMER?key=${key}`);
  }
  GetNumMaxCustomer(num: string): Observable<any> {
    return this._http.get(`/BankMasterData/Get_Num_KEY_CUSTOMER?num=${num}`);
  }

  FindDataHistoryByApprover(id?: number, company?: string,status?: string): Observable<CustomerSupplier> {
    // ตรวจสอบเงื่อนไขว่าเราจะส่งค่าอะไรบ้าง
    let params = '';
  
    if (id) {
      params += `?userid=${id}`;
    }
  
    if (company) {
      params += params ? `&company=${company}` : `?company=${company}`;
    }

    if (status) {
      params += params ? `&status=${status}` : `?status=${status}`;
    }
  
    return this._http.get<CustomerSupplier>(`/Customer/FindDataHistoryByApprover${params}`);
  }

  FindDataHistoryByApproverFN(id?: number, company?: string,status?: string): Observable<CustomerSupplier> {
    // ตรวจสอบเงื่อนไขว่าเราจะส่งค่าอะไรบ้าง
    let params = '';
  
    if (id) {
      params += `?userid=${id}`;
    }
  
    if (company) {
      params += params ? `&company=${company}` : `?company=${company}`;
    }

    if (status) {
      params += params ? `&status=${status}` : `?status=${status}`;
    }
  
    return this._http.get<CustomerSupplier>(`/Customer/FindDataHistoryByApproverFN${params}`);
  }

  uploadFile(file: any): Observable<any> {
    return this._http.post(`/Customer/upload`, file);
  }
}