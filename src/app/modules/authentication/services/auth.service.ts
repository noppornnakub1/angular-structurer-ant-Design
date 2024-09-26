import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IUser } from '../../user-manager/interface/user.interface';
import { IRole } from '../../user-manager/interface/role.interface';
import { Router } from '@angular/router';

export interface LoginResponse {
  user: IUser;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject: BehaviorSubject<IUser | null>;
  public currentUser: Observable<IUser | null>;

  private currentRoleubject: BehaviorSubject<IRole | null>;
  public currenttRole: Observable<IRole | null>;

  constructor(private http: HttpClient,private router: Router) {

    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<IUser | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();

    const storedRole = localStorage.getItem('currentRole');
    this.currentRoleubject = new BehaviorSubject<IRole | null>(storedRole ? JSON.parse(storedRole) : null);
    this.currenttRole = this.currentRoleubject.asObservable();

  }

  login(username: string, password: string): Observable<IUser | null> {
    const loginRequest: any = { username, password };

    return this.http.post<IUser>('/Login/signIn', loginRequest).pipe(
      map(response => {
        
         if (response && response.status == 1) { // ตรวจสอบค่า status เป็น true
        this.setUser(response);
        return response;
      }
        return null;
      }),
      catchError(this.handleError<IUser>('login', undefined))
    );
  }


  getRole(id: number): Observable<IRole | null> {
    return this.http.get<IRole>(`/User/findby/${id}`).pipe(
      map(response => {
        if (response) {
          this.setRole(response);
          return response;
        }
        return null;
      }),
      catchError(this.handleError<IRole>('getRole', undefined))
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

  isLoggedIn(): boolean {
    const currentUser = localStorage.getItem('currentUser');
    return !!currentUser;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRole');
  }
}
