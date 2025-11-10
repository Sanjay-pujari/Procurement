import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const vendorRedirectGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.hasRole('Vendor')) {
    router.navigateByUrl('/vendor-portal');
    return false;
  }

  return true;
};


