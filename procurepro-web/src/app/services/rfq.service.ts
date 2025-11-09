import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum RfqStatus {
  Draft = 0,
  Published = 1,
  Closed = 2,
  Awarded = 3
}

export enum RfqVendorStatus {
  Pending = 0,
  InvitationSent = 1,
  Acknowledged = 2,
  QuoteSubmitted = 3,
  Declined = 4
}

export interface RfqSummary {
  id: string;
  referenceNumber: string;
  title: string;
  status: RfqStatus;
  dueDate: string;
  createdAt: string;
  itemCount: number;
  vendorCount: number;
  purchaseRequisitionNumber?: string;
}

export interface RfqItem {
  id: string;
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
}

export interface RfqAttachment {
  id: string;
  fileName: string;
  storageUrl: string;
  uploadedAt: string;
  uploadedByUserId: string;
}

export interface RfqVendor {
  id: string;
  vendorId: string;
  vendorName: string;
  status: RfqVendorStatus;
  invitationSentAt?: string;
  acknowledgedAt?: string;
  quoteSubmittedAt?: string;
  notes?: string;
}

export interface RfqDetail {
  id: string;
  referenceNumber: string;
  title: string;
  terms?: string;
  status: RfqStatus;
  dueDate: string;
  createdAt: string;
  publishedAt?: string;
  closedAt?: string;
  purchaseRequisitionId?: string;
  purchaseRequisitionNumber?: string;
  items: RfqItem[];
  attachments: RfqAttachment[];
  vendors: RfqVendor[];
}

export interface CreateRfqItemInput {
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
}

export interface RfqAttachmentInput {
  fileName: string;
  storageUrl: string;
}

export interface RfqVendorInput {
  vendorId: string;
  notes?: string;
}

export interface CreateRfqRequest {
  title: string;
  terms?: string;
  dueDate: string;
  purchaseRequisitionId?: string;
  items: CreateRfqItemInput[];
  attachments?: RfqAttachmentInput[];
  vendors: RfqVendorInput[];
}

export interface ConvertPrToRfqRequest {
  purchaseRequisitionId: string;
  title: string;
  terms?: string;
  dueDate: string;
  attachments?: RfqAttachmentInput[];
  vendors: RfqVendorInput[];
}

export interface UpdateRfqRequest {
  title: string;
  terms?: string;
  dueDate: string;
  items: CreateRfqItemInput[];
  attachments?: RfqAttachmentInput[];
  vendors: RfqVendorInput[];
}

export interface SendInvitationRequest {
  vendorIds: string[];
}

export interface VendorAcknowledgeRequest {
  accepted: boolean;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class RFQService {
  private apiUrl = `${environment.apiBase}/RFQ`;

  constructor(private http: HttpClient) {}

  list(): Observable<RfqSummary[]> {
    return this.http.get<RfqSummary[]>(this.apiUrl);
  }

  detail(id: string): Observable<RfqDetail> {
    return this.http.get<RfqDetail>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateRfqRequest): Observable<RfqDetail> {
    return this.http.post<RfqDetail>(this.apiUrl, payload);
  }

  convert(payload: ConvertPrToRfqRequest): Observable<RfqDetail> {
    return this.http.post<RfqDetail>(`${this.apiUrl}/convert`, payload);
  }

  update(id: string, payload: UpdateRfqRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  publish(id: string, vendorIds?: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/publish`, vendorIds ? { vendorIds } : {});
  }

  close(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/close`, {});
  }

  resendInvitations(id: string, vendorIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/resend-invitations`, { vendorIds });
  }

  acknowledge(id: string, vendorId: string, payload: VendorAcknowledgeRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/vendors/${vendorId}/acknowledge`, payload);
  }
}
