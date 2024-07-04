// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IUser } from '../interface/user.interface';


@Injectable({
  providedIn: 'root'
})
export class UserService {

    constructor(private http: HttpClient) {}

    getUsers(): Observable<IUser[]> {
        return this.http.get<IUser[]>('/assets/data/users.json');
      }}
