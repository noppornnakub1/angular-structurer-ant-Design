import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {

  // const apiReq = req.clone({ url: `${environment.api_url}${req.url}` });
  // return next(apiReq);
  const token = localStorage.getItem('currentUser') 
    ? JSON.parse(localStorage.getItem('currentUser')!).jwtToken 
    : null;

  // สร้างคำขอใหม่พร้อมเพิ่ม Authorization Header
  const apiReq = req.clone({
    url: `${environment.api_url}${req.url}`,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return next(apiReq);
};
