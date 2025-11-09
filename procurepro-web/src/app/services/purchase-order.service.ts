import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PurchaseOrderSummary {
  id: string;
  purchaseOrderNumber: string;
  vendorId: string;
  vendorQuotationId: string;
  status: number;
  createdAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
}

export interface PurchaseOrderItem {
  rfqItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface PurchaseOrderDetail extends PurchaseOrderSummary {
  currency: string;
  totalAmount: number;
  items: PurchaseOrderItem[];
  amendmentsJson?: string;
}

export interface IssuePurchaseOrderRequest {
  vendorQuotationId: string;
  amendmentsJson?: string;
}

export interface PurchaseOrderIssueCandidate {
  vendorQuotationId: string;
  vendorName: string;
  rfqReference?: string;
  totalAmount: number;
  currency: string;
  submittedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private apiUrl = `${environment.apiBase}/PurchaseOrder`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PurchaseOrderSummary[]> {
    return this.http.get<PurchaseOrderSummary[]>(this.apiUrl);
  }

  getById(id: string): Observable<PurchaseOrderDetail> {
    return this.http.get<PurchaseOrderDetail>(`${this.apiUrl}/${id}`);
  }

  getIssueCandidates(): Observable<PurchaseOrderIssueCandidate[]> {
    return this.http.get<PurchaseOrderIssueCandidate[]>(`${this.apiUrl}/ready-to-issue`);
  }

  issue(request: IssuePurchaseOrderRequest): Observable<PurchaseOrderDetail> {
    return this.http.post<PurchaseOrderDetail>(`${this.apiUrl}/issue`, request);
  }

  acknowledge(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/acknowledge`, {});
  }

  complete(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/complete`, {});
  }
}

