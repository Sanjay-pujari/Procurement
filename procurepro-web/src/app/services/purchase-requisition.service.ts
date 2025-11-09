import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum PurchaseRequisitionStatus {
  Draft = 0,
  PendingApproval = 1,
  Approved = 2,
  Rejected = 3
}

export enum PurchaseRequisitionUrgency {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum PurchaseRequisitionApprovalStatus {
  NotStarted = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Skipped = 4
}

export interface PurchaseRequisitionSummary {
  id: string;
  prNumber: string;
  title: string;
  status: PurchaseRequisitionStatus;
  urgency: PurchaseRequisitionUrgency;
  neededBy: string;
  createdAt: string;
  requestedByUserId: string;
}

export interface PurchaseRequisitionItem {
  id: string;
  itemName: string;
  specification?: string;
  quantity: number;
  unitOfMeasure?: string;
  estimatedUnitCost: number;
}

export interface PurchaseRequisitionAttachment {
  id: string;
  fileName: string;
  storageUrl: string;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface PurchaseRequisitionApproval {
  id: string;
  sequence: number;
  approverUserId: string;
  status: PurchaseRequisitionApprovalStatus;
  actionedAt?: string;
  comments?: string;
}

export interface PurchaseRequisitionDetail {
  id: string;
  prNumber: string;
  title: string;
  description?: string;
  costCenter: string;
  department?: string;
  urgency: PurchaseRequisitionUrgency;
  status: PurchaseRequisitionStatus;
  neededBy: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  requestedByUserId: string;
  items: PurchaseRequisitionItem[];
  attachments: PurchaseRequisitionAttachment[];
  approvals: PurchaseRequisitionApproval[];
}

export interface CreatePurchaseRequisitionItemInput {
  itemName: string;
  specification?: string;
  quantity: number;
  unitOfMeasure?: string;
  estimatedUnitCost: number;
}

export interface CreatePurchaseRequisitionAttachmentInput {
  fileName: string;
  storageUrl: string;
}

export interface CreatePurchaseRequisitionRequest {
  title: string;
  description?: string;
  costCenter: string;
  department?: string;
  urgency: PurchaseRequisitionUrgency;
  neededBy: string;
  items: CreatePurchaseRequisitionItemInput[];
  attachments?: CreatePurchaseRequisitionAttachmentInput[];
  approverUserIds: string[];
}

export interface SubmitPurchaseRequisitionRequest {
  approverUserIds?: string[];
}

export interface ApprovalActionRequest {
  comments?: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseRequisitionService {
  private apiUrl = `${environment.apiBase}/PurchaseRequisitions`;

  constructor(private http: HttpClient) {}

  list(): Observable<PurchaseRequisitionSummary[]> {
    return this.http.get<PurchaseRequisitionSummary[]>(this.apiUrl);
  }

  get(id: string): Observable<PurchaseRequisitionDetail> {
    return this.http.get<PurchaseRequisitionDetail>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreatePurchaseRequisitionRequest): Observable<PurchaseRequisitionDetail> {
    return this.http.post<PurchaseRequisitionDetail>(this.apiUrl, payload);
  }

  submit(id: string, payload: SubmitPurchaseRequisitionRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/submit`, payload);
  }

  approve(id: string, payload: ApprovalActionRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/approve`, payload);
  }

  reject(id: string, payload: ApprovalActionRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, payload);
  }
}


