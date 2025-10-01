import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Invoice {
  id?: string;
  purchaseOrderId: string;
  amount: number;
  paymentStatus: number;
  submittedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private apiUrl = `${environment.apiBase}/Invoice`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.apiUrl);
  }

  getById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }

  getByPO(poId: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/by-po/${poId}`);
  }

  create(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, invoice);
  }

  update(id: string, invoice: Invoice): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, invoice);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  markPaid(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/mark-paid`, {});
  }

  markPartiallyPaid(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/mark-partially-paid`, {});
  }
}

