
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISupplier } from '../interface/supplier.interface';

@Injectable({
    providedIn: 'root'
  })
  export class SupplierService {

    constructor(private http: HttpClient) { }
    getData(): Observable<ISupplier[]> {
      return this.http.get<ISupplier[]>('/assets/data/customer-data.json');
    }

  }