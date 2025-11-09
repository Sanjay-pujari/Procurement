import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum VendorVerificationStatus {
  PendingReview = 0,
  Approved = 1,
  Rejected = 2,
  Suspended = 3,
  Blacklisted = 4
}

export interface VendorSummary {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  category?: string;
  isActive: boolean;
  verificationStatus: VendorVerificationStatus;
  createdAt: string;
  performanceRating: number;
}

export interface VendorDocument {
  id: string;
  documentType: string;
  fileName: string;
  storageUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  notes?: string;
}

export interface VendorStatusChange {
  id: string;
  status: VendorVerificationStatus;
  changedAt: string;
  remarks?: string;
  changedByUserId?: string;
}

export interface VendorPurchaseOrder {
  id: string;
  bidId: string;
  status: string;
  createdAt: string;
}

export interface VendorInvoice {
  id: string;
  purchaseOrderId: string;
  amount: number;
  paymentStatus: string;
  submittedAt: string;
}

export interface VendorHistory {
  purchaseOrders: VendorPurchaseOrder[];
  invoices: VendorInvoice[];
}

export interface VendorDetail {
  vendor: VendorSummary;
  history: VendorHistory;
  documents: VendorDocument[];
  statusChanges: VendorStatusChange[];
}

export interface SubmitKycRequest {
  phone?: string;
  address?: string;
  taxId?: string;
  website?: string;
  notes?: string;
  documents: Array<{ documentType: string; fileName: string; storageUrl: string; notes?: string }>;
}

export interface ReviewVendorRequest {
  status: VendorVerificationStatus.Approved | VendorVerificationStatus.Rejected;
  remarks?: string;
}

export interface UpdateVendorStatusRequest {
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class VendorService {
  private apiUrl = `${environment.apiBase}/vendors`;

  constructor(private http: HttpClient) {}

  list(): Observable<VendorSummary[]> {
    return this.http.get<VendorSummary[]>(this.apiUrl);
  }

  getDetail(id: string): Observable<VendorDetail> {
    return this.http.get<VendorDetail>(`${this.apiUrl}/${id}`);
  }

  review(id: string, payload: ReviewVendorRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/review`, payload);
  }

  suspend(id: string, payload: UpdateVendorStatusRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/suspend`, payload);
  }

  blacklist(id: string, payload: UpdateVendorStatusRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/blacklist`, payload);
  }

  reinstate(id: string, payload: UpdateVendorStatusRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reinstate`, payload);
  }

  submitKyc(payload: SubmitKycRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/self/kyc`, payload);
  }
}


