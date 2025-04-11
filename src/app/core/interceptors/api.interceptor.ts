import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { catchError, throwError } from "rxjs";
import { Router } from '@angular/router';
import { inject } from "@angular/core";
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const token = localStorage.getItem('currentUser') 
    ? JSON.parse(localStorage.getItem('currentUser')!).jwtToken 
    : null;

  const apiReq = req.clone({
    url: `${environment.api_url}${req.url}`,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return next(apiReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('currentUser');
        router.navigate(['/login']);
      }
      return throwError(error);
    })
  );
};
