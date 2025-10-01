import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PurchaseOrder {
  id?: string;
  bidId: string;
  status: number;
  amendmentsJson?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private apiUrl = `${environment.apiBase}/PurchaseOrder`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(this.apiUrl);
  }

  getById(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
  }

  getByBid(bidId: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/by-bid/${bidId}`);
  }

  create(po: PurchaseOrder): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.apiUrl, po);
  }

  update(id: string, po: PurchaseOrder): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, po);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  acknowledge(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/acknowledge`, {});
  }

  complete(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/complete`, {});
  }
}

