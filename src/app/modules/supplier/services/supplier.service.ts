
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISupplier } from '../interface/supplier.interface';

@Injectable({
    providedIn: 'root'
  })
  export class SupplierService {

    constructor(private _http: HttpClient) { }
    
    getData() {
      return this._http.get(`/Supplier/SupplierInfo`);
    }

  }