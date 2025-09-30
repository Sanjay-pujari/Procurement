import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (role: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() && auth.hasRole(role);
};
