import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

    private apiUrl = '/Email/send'; // เปลี่ยนเป็น URL ของ API ของคุณ

  constructor(private http: HttpClient) { }

  sendEmail(to: string, subject: string, body: string): Observable<any> {
    const emailRequest = { to, subject, body };
    return this.http.post(`/Email/send`, emailRequest);
  }
}
