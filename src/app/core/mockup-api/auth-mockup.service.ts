import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';


interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  token: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthMockupService {
  private usersUrl = '/assets/data/users.json';  // URL to web api

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse | null> {
    return this.http.get<User[]>(this.usersUrl).pipe(
      map(users => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          return {
            token: user.token,
            user: user
          };
        }
        return null;
      }),
      catchError(this.handleError<LoginResponse>('login', undefined))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      return of(result as T);
    };
  }
}
