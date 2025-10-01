import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Role {
  id: string;
  name: string;
  userCount?: number;
  users?: { id: string; email: string; displayName: string }[];
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private apiUrl = `${environment.apiBase}/RoleManagement`;

  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  createRole(role: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  updateRole(id: string, role: UpdateRoleRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addUserToRole(roleId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${roleId}/users/${userId}`, {});
  }

  removeUserFromRole(roleId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roleId}/users/${userId}`);
  }
}

