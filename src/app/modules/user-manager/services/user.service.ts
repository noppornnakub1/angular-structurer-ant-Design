// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { IUser } from '../interface/user.interface';


@Injectable({
  providedIn: 'root'
})
export class UserService {
    private apiUrl = 'https://api.example.com/users'; // URL ของ API ที่ให้ข้อมูล JSON

    constructor(private http: HttpClient) {}

    getUsers(): Observable<User[]> {
        return this.http.get<IUser[]>('/assets/data/users.json').pipe(
            map(data => data.map(item => new User(item)))
        );
    }
}
