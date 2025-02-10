import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataBank } from '../../modules/supplier/pages/supplier-add/supplier-add.component';

@Injectable({
    providedIn: 'root'
  })
  export class LogDownloadSerive {
  
    constructor(private http: HttpClient) { }
  
    logDownload(username: string, fileUrl: string): Observable<any> {
        const requestData = { Username: username, FileUrl: fileUrl };
        return this.http.post(`/log-download`, requestData);
      }
  }