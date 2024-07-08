import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IUser } from '../../user-manager/interface/user.interface';

export interface LoginResponse {
  user: IUser;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {


  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse | null> {
    const loginRequest: any = { username, password };

    return this.http.post<LoginResponse>('/User/login', loginRequest).pipe(
      map(response => {
        if (response && response.user) {
          this.setUser(response.user);
          return response;
        }
        return null;
      }),
      catchError(this.handleError<LoginResponse>('login', undefined))
    );
  }

  private setUser(user: IUser): void {
    // Your logic to set user, e.g., saving to localStorage
    localStorage.setItem('user', JSON.stringify(user));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
