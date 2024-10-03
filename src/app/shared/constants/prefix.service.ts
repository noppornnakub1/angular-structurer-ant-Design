import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { prefix } from '../../modules/supplier/pages/supplier-add/supplier-add.component';


@Injectable({
  providedIn: 'root'
})
export class prefixService {
    private apiUrl = '/Prefix/getAllPrefixes';
    // private apiUrl = '/PrefixMasterData/PrefixInfo';
  
    constructor(private http: HttpClient) { }
  
    getPrefix(): Observable<prefix[]> {
      return this.http.get<prefix[]>(this.apiUrl);
    }
  }