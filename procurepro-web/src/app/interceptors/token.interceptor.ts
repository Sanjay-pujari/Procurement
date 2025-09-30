import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const raw = localStorage.getItem('pp_token');
  if (raw) {
    const { accessToken } = JSON.parse(raw);
    if (accessToken) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
    }
  }
  return next(req);
};
