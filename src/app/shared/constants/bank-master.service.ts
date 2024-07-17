import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataBank } from '../../modules/supplier/pages/supplier-add/supplier-add.component';

@Injectable({
    providedIn: 'root'
  })
  export class BankMasterService {
    private apiUrl = '/BankMasterData/BankMasterDataInfo';
  
    constructor(private http: HttpClient) { }
  
    getBankData(): Observable<DataBank[]> {
      return this.http.get<DataBank[]>(this.apiUrl);
    }
  }