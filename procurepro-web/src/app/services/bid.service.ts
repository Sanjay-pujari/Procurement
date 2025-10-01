import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface BidItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Bid {
  id?: string;
  rfqId: string;
  vendorId: string;
  visibility: number;
  totalAmount: number;
  score: number;
  items: BidItem[];
  submittedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class BidService {
  private apiUrl = `${environment.apiBase}/Bid`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Bid[]> {
    return this.http.get<Bid[]>(this.apiUrl);
  }

  getById(id: string): Observable<Bid> {
    return this.http.get<Bid>(`${this.apiUrl}/${id}`);
  }

  getByRFQ(rfqId: string): Observable<Bid[]> {
    return this.http.get<Bid[]>(`${this.apiUrl}/by-rfq/${rfqId}`);
  }

  create(bid: Bid): Observable<Bid> {
    return this.http.post<Bid>(this.apiUrl, bid);
  }

  update(id: string, bid: Bid): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, bid);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  evaluate(id: string): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/${id}/evaluate`, {});
  }
}

