import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleAnyGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() && roles.some(role => auth.hasRole(role));
};

