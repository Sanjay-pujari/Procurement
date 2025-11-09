import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  displayName: string;
  companyName?: string;
  isActive: boolean;
  vendorCategory?: string;
  twoFactorEnabled: boolean;
  roles: string[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  companyName?: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  displayName?: string;
  companyName?: string;
  isActive: boolean;
  roles?: string[];
}

export interface ResetPasswordRequest {
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private apiUrl = `${environment.apiBase}/UserManagement`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: string, user: UpdateUserRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/deactivate`, {});
  }

  activateUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/activate`, {});
  }

  resetPassword(id: string, request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/reset-password`, request);
  }

  enableTwoFactor(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/enable-2fa`, {});
  }

  disableTwoFactor(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/disable-2fa`, {});
  }
}

