import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IUser } from '../../user-manager/interface/user.interface';
import { IRole } from '../../user-manager/interface/role.interface';

export interface LoginResponse {
  user: IUser;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject!: BehaviorSubject<IUser | null>;
  private currentRoleubject!: BehaviorSubject<IRole | null>;
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<IUser | null> {
    const loginRequest: any = { username, password };

    return this.http.post<IUser>('/User/login', loginRequest).pipe(
      map(response => {
        if (response) {
          this.setUser(response);
          return response;
        }
        return null;
      }),
      catchError(this.handleError<IUser>('login', undefined))
    );
  }


  getRole(id: number): Observable<IRole | null> {
    return this.http.post<IRole>('/User/findby/', id).pipe(
      map(response => {
        if (response) {
         
          this.setRole(response);
          return response;
        }
        return null;
      }),
      catchError(this.handleError<IRole>('login', undefined))
    );
  }

  private setRole(user: IRole): void {
    // Your logic to set user, e.g., saving to localStorage
    localStorage.setItem('currentRole', JSON.stringify(user));
    this.currentRoleubject.next(user);
  }
  private setUser(user: IUser): void {
    // Your logic to set user, e.g., saving to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}