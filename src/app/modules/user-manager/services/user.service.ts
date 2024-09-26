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

    constructor(private _http: HttpClient) {}

    getUser() {
      return this._http.get(`/User/UserInfo`);
    }

    addData(user: any): Observable<any> {
      return this._http.post(`/User/AddUser`, user);
    }

    findUserById(id: number): Observable<IUser> {
      return this._http.get<IUser>(`/User/${id}`);
    }

    updateUser(user_id: number, data: IUser): Observable<any> {
      return this._http.put(`/User/UpdateUser?user_id=${user_id}`, data);
    }

    findUserByUsername(username: string): Observable<any> {
      return this._http.get(`/User/find-user/${username}`);
    }

    updatePassword(username: string, newPassword: string): Observable<any> {
      const data = {
        Username: username,
        NewPassword: newPassword
      };
      return this._http.post(`/User/update-password`, data);
  }
    
  }
