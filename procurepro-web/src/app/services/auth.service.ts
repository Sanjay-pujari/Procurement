import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TokenResponse {
  accessToken: string;
  expiresAt: string;
  roles: string[];
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  token?: TokenResponse;
  deliveryChannel?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'pp_token';
  constructor(private http: HttpClient) {}

  login(email: string, password: string, twoFactorCode?: string) {
    const payload: LoginRequest = { email, password };
    if (twoFactorCode?.trim()) {
      payload.twoFactorCode = twoFactorCode.trim();
    }
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, payload);
  }

  registerVendor(companyName: string, email: string, password: string, category?: string) {
    return this.http.post<TokenResponse>(`${environment.apiBase}/auth/register-vendor`, { companyName, email, password, category });
  }

  saveToken(token: TokenResponse) { localStorage.setItem(this.key, JSON.stringify(token)); }
  get token(): TokenResponse | null { const v = localStorage.getItem(this.key); return v ? JSON.parse(v) : null; }
  logout() { localStorage.removeItem(this.key); }

  isAuthenticated(): boolean {
    const t = this.token; if (!t) return false; return new Date(t.expiresAt) > new Date();
  }
  hasRole(role: string): boolean {
    const t = this.token; return !!t && t.roles?.includes(role);
  }
}
