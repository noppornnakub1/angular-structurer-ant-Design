
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICustomer } from '../interface/customer.interface';

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

  // approveCustomer(id: number): Observable<any> {
  //   return this._http.post<any>(`${this.apiUrl}/ApproveCustomer`, { id });
  // }

  // rejectCustomer(id: number): Observable<any> {
  //   return this._http.post<any>(`${this.apiUrl}/RejectCustomer`, { id });
  // }

}