import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataLocation } from '../../modules/supplier/pages/supplier-add/supplier-add.component';

@Injectable({
  providedIn: 'root'
})
export class PostCodeService {
    private apiUrl = 'https://localhost:7126/api/PostCode/PostCodeInfo';
  
    constructor(private http: HttpClient) { }
  
    getPostCodes(): Observable<DataLocation[]> {
      return this.http.get<DataLocation[]>(this.apiUrl);
    }
  }