
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICustomer } from '../interface/customer.interface';

@Injectable({
    providedIn: 'root'
  })
  export class CustomerService {

    constructor(private http: HttpClient) { }
    getData(): Observable<ICustomer[]> {
      return this.http.get<ICustomer[]>('/assets/data/customer-data.json');
    }

  }