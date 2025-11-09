import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RfqVendorStatus } from './rfq.service';

export interface VendorRfqSummary {
  rfqId: string;
  referenceNumber: string;
  title: string;
  dueDate: string;
  status: RfqVendorStatus;
  quoteSubmitted: boolean;
  invitationSentAt?: string;
}

export interface VendorRfqItem {
  itemId: string;
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
}

export interface VendorRfqAttachment {
  attachmentId: string;
  fileName: string;
  storageUrl: string;
}

export interface VendorQuotationItem {
  itemId: string;
  rfqItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface VendorQuotationAttachment {
  attachmentId: string;
  fileName: string;
  storageUrl: string;
  uploadedAt: string;
  uploadedByUserId: string;
}

export interface VendorQuotation {
  quotationId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  expectedDeliveryDate?: string;
  deliveryTerms?: string;
  remarks?: string;
  submittedByAdmin: boolean;
  items: VendorQuotationItem[];
  attachments: VendorQuotationAttachment[];
}

export interface VendorRfqDetail {
  rfqId: string;
  referenceNumber: string;
  title: string;
  terms?: string;
  dueDate: string;
  items: VendorRfqItem[];
  attachments: VendorRfqAttachment[];
  existingQuotation?: VendorQuotation;
}

export interface SubmitQuotationItem {
  rfqItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface SubmitQuotationAttachment {
  fileName: string;
  storageUrl: string;
}

export interface SubmitQuotationRequest {
  taxAmount: number;
  currency: string;
  expectedDeliveryDate?: string;
  deliveryTerms?: string;
  remarks?: string;
  items: SubmitQuotationItem[];
  attachments?: SubmitQuotationAttachment[];
}

@Injectable({ providedIn: 'root' })
export class VendorPortalService {
  private apiUrl = `${environment.apiBase}/vendor-portal`;

  constructor(private http: HttpClient) {}

  listAssignedRfqs(): Observable<VendorRfqSummary[]> {
    return this.http.get<VendorRfqSummary[]>(`${this.apiUrl}/rfqs`);
  }

  getRfqDetail(rfqId: string): Observable<VendorRfqDetail> {
    return this.http.get<VendorRfqDetail>(`${this.apiUrl}/rfqs/${rfqId}`);
  }

  submitQuote(rfqId: string, payload: SubmitQuotationRequest): Observable<VendorQuotation> {
    return this.http.post<VendorQuotation>(`${this.apiUrl}/rfqs/${rfqId}/quote`, payload);
  }
}


