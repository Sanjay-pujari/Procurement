import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface RFQItem {
  id?: string;
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
}

export interface RFQVendor {
  id?: string;
  vendorId: string;
}

export interface RFQ {
  id?: string;
  title: string;
  terms?: string;
  dueDate: string;
  status: number;
  items: RFQItem[];
  rfqVendors: RFQVendor[];
}

@Injectable({ providedIn: 'root' })
export class RFQService {
  private apiUrl = `${environment.apiBase}/RFQ`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RFQ[]> {
    return this.http.get<RFQ[]>(this.apiUrl);
  }

  getById(id: string): Observable<RFQ> {
    return this.http.get<RFQ>(`${this.apiUrl}/${id}`);
  }

  create(rfq: RFQ): Observable<RFQ> {
    return this.http.post<RFQ>(this.apiUrl, rfq);
  }

  update(id: string, rfq: RFQ): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, rfq);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publish(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/publish`, {});
  }

  close(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/close`, {});
  }
}

