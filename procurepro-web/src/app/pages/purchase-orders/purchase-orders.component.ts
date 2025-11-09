import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService, PurchaseOrderSummary, PurchaseOrderDetail, IssuePurchaseOrderRequest, PurchaseOrderIssueCandidate } from '../../services/purchase-order.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Purchase Orders</h1>
        <button class="btn btn-primary" (click)="openIssueModal()">+ Issue Purchase Order</button>
      </div>

      <div class="po-list" *ngIf="purchaseOrders.length; else emptyState">
        <div class="po-card" *ngFor="let po of purchaseOrders" [class.active]="po.id === selectedPo?.id">
          <div class="po-header">
            <div>
              <h3>{{ po.purchaseOrderNumber }}</h3>
              <span class="sub">Issued {{ po.createdAt | date:'medium' }}</span>
            </div>
            <span class="status-badge" [class]="'status-' + po.status">
              {{ getStatusLabel(po.status) }}
            </span>
          </div>
          <div class="po-body">
            <div class="detail"><strong>Vendor:</strong> <span>{{ po.vendorId | slice:0:8 }}</span></div>
            <div class="detail"><strong>Quotation:</strong> <span>{{ po.vendorQuotationId | slice:0:8 }}</span></div>
            <div class="detail" *ngIf="po.acknowledgedAt"><strong>Acknowledged:</strong> <span>{{ po.acknowledgedAt | date:'medium' }}</span></div>
            <div class="detail" *ngIf="po.completedAt"><strong>Completed:</strong> <span>{{ po.completedAt | date:'medium' }}</span></div>
          </div>
          <div class="actions">
            <button class="btn btn-secondary" (click)="viewDetails(po.id)">View Details</button>
            <button class="btn btn-success" *ngIf="po.status === 0" (click)="acknowledgePO(po.id)">Acknowledge</button>
            <button class="btn btn-info" *ngIf="po.status === 1" (click)="completePO(po.id)">Mark Complete</button>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty">No purchase orders yet. Issue one to get started.</div>
      </ng-template>

      <div class="detail-panel" *ngIf="selectedPo">
        <div class="detail-header">
          <div>
            <h2>{{ selectedPo.purchaseOrderNumber }}</h2>
            <p>Issued {{ selectedPo.createdAt | date:'medium' }}</p>
          </div>
          <button class="btn btn-link" (click)="closeDetail()">Close</button>
        </div>
        <div class="detail-grid">
          <div><strong>Status:</strong> {{ getStatusLabel(selectedPo.status) }}</div>
          <div><strong>Vendor:</strong> {{ selectedPo.vendorId }}</div>
          <div><strong>Quotation:</strong> {{ selectedPo.vendorQuotationId }}</div>
          <div><strong>Total:</strong> {{ selectedPo.totalAmount | currency:selectedPo.currency }}</div>
          <div *ngIf="selectedPo.acknowledgedAt"><strong>Acknowledged:</strong> {{ selectedPo.acknowledgedAt | date:'medium' }}</div>
          <div *ngIf="selectedPo.completedAt"><strong>Completed:</strong> {{ selectedPo.completedAt | date:'medium' }}</div>
        </div>

        <div class="section" *ngIf="selectedPo.items.length">
          <h3>Line Items</h3>
          <table>
            <thead>
              <tr>
                <th>RFQ Item</th>
                <th class="right">Quantity</th>
                <th class="right">Unit Price</th>
                <th class="right">Line Total</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of selectedPo.items">
                <td>{{ item.rfqItemId | slice:0:8 }}</td>
                <td class="right">{{ item.quantity }}</td>
                <td class="right">{{ item.unitPrice | number:'1.2-2' }}</td>
                <td class="right">{{ item.lineTotal | number:'1.2-2' }}</td>
                <td>{{ item.notes || '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section" *ngIf="selectedPo.amendmentsJson">
          <h3>Amendments</h3>
          <pre>{{ selectedPo.amendmentsJson }}</pre>
        </div>
      </div>

      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Issue Purchase Order</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Select Vendor Quotation</label>
              <div class="select-row">
                <select [(ngModel)]="selectedCandidateId" (ngModelChange)="onCandidateSelected(selectedCandidateId)" class="form-control">
                  <option value="">-- Select quotation --</option>
                  <option *ngFor="let candidate of issueCandidates" [value]="candidate.vendorQuotationId">
                    {{ candidate.vendorName }} · {{ candidate.rfqReference || 'RFQ' }} · {{ candidate.totalAmount | currency:candidate.currency }}
                  </option>
                </select>
                <button type="button" class="btn btn-link" (click)="refreshIssueCandidates()" [disabled]="issueCandidatesLoading">
                  {{ issueCandidatesLoading ? 'Refreshing…' : 'Refresh' }}
                </button>
              </div>
              <div class="helper" *ngIf="issueCandidatesLoading">Loading quotations…</div>
              <div class="helper error" *ngIf="issueCandidateError">{{ issueCandidateError }}</div>
              <div class="helper" *ngIf="!issueCandidatesLoading && !issueCandidateError && issueCandidates.length === 0">
                No eligible quotations found. You can paste an ID below.
              </div>
            </div>
            <div class="form-group">
              <label>Or enter quotation ID manually</label>
              <input type="text" [(ngModel)]="issueRequest.vendorQuotationId" (ngModelChange)="onManualIdChange($event)" class="form-control" placeholder="Quotation GUID" />
            </div>
            <div class="summary" *ngIf="selectedCandidate">
              <h3>Selected Quotation</h3>
              <ul>
                <li><strong>Vendor:</strong> {{ selectedCandidate.vendorName }}</li>
                <li><strong>Reference:</strong> {{ selectedCandidate.rfqReference || '—' }}</li>
                <li><strong>Total:</strong> {{ selectedCandidate.totalAmount | currency:selectedCandidate.currency }}</li>
                <li><strong>Submitted:</strong> {{ selectedCandidate.submittedAt | date:'medium' }}</li>
              </ul>
            </div>
            <div class="form-group">
              <label>Amendments (JSON)</label>
              <textarea [(ngModel)]="issueRequest.amendmentsJson" class="form-control" rows="4" placeholder="Optional"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" [disabled]="isIssuing" (click)="issuePurchaseOrder()">
              {{ isIssuing ? 'Issuing…' : 'Issue Purchase Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .po-list { display: grid; gap: 1rem; }
    .po-card { background: #fff; padding: 1.5rem; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 1rem; }
    .po-card.active { border: 2px solid #2563eb; }
    .po-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .po-header h3 { margin: 0; font-size: 1.25rem; }
    .po-header .sub { color: #6b7280; font-size: 0.875rem; }
    .po-body { display: grid; gap: 0.5rem; font-size: 0.95rem; }
    .detail { display: flex; gap: 0.5rem; }
    .actions { display: flex; gap: 0.5rem; }
    .btn { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #374151; color: #fff; }
    .btn-success { background: #059669; color: #fff; }
    .btn-info { background: #0891b2; color: #fff; }
    .btn-link { background: none; color: #2563eb; padding: 0.25rem 0.5rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; }
    .status-0 { background: #dbeafe; color: #1e3a8a; }
    .status-1 { background: #fef3c7; color: #92400e; }
    .status-2 { background: #d1fae5; color: #065f46; }
    .status-3 { background: #fee2e2; color: #991b1b; }
    .detail-panel { background: #f9fafb; border-radius: 10px; padding: 1.5rem; box-shadow: inset 0 0 0 1px #e5e7eb; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-header h2 { margin: 0; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .section { margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
    th { text-align: left; background: #f3f4f6; }
    td.right { text-align: right; }
    pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 8px; overflow: auto; font-size: 0.85rem; }
    .empty { text-align: center; padding: 2rem; color: #6b7280; }
    .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: #fff; border-radius: 10px; width: 90%; max-width: 520px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
    .modal-header, .modal-footer { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
    .modal-footer { border-bottom: none; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
    .form-control { width: 100%; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #d1d5db; font-size: 1rem; }
    textarea.form-control { resize: vertical; min-height: 120px; font-family: monospace; }
    .select-row { display: flex; gap: 0.5rem; align-items: center; }
    .select-row .form-control { flex: 1; }
    .helper { margin-top: 0.5rem; font-size: 0.85rem; color: #6b7280; }
    .helper.error { color: #b91c1c; }
    .summary { background: #f3f4f6; border-radius: 8px; padding: 1rem; }
    .summary h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .summary ul { margin: 0; padding-left: 1rem; display: grid; gap: 0.25rem; }
  `]
})
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrderSummary[] = [];
  selectedPo: PurchaseOrderDetail | null = null;
  showModal = false;
  isIssuing = false;
  issueRequest: IssuePurchaseOrderRequest = { vendorQuotationId: '' };
  issueCandidates: PurchaseOrderIssueCandidate[] = [];
  issueCandidatesLoading = false;
  issueCandidateError: string | null = null;
  selectedCandidateId: string | null = null;

  constructor(private poService: PurchaseOrderService) {}

  ngOnInit(): void {
    this.loadPOs();
  }

  loadPOs(): void {
    this.poService.getAll().subscribe({
      next: (data) => {
        this.purchaseOrders = data;
        if (this.selectedPo) {
          const stillExists = data.some(po => po.id === this.selectedPo?.id);
          if (!stillExists) {
            this.selectedPo = null;
          }
        }
      },
      error: (err) => console.error('Error loading purchase orders:', err)
    });
  }

  get selectedCandidate(): PurchaseOrderIssueCandidate | null {
    if (!this.selectedCandidateId) {
      return null;
    }
    return this.issueCandidates.find(c => c.vendorQuotationId === this.selectedCandidateId) ?? null;
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Issued';
      case 1: return 'Acknowledged';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  viewDetails(id: string): void {
    if (this.selectedPo?.id === id) {
      return;
    }

    this.poService.getById(id).subscribe({
      next: (detail) => this.selectedPo = detail,
      error: (err) => console.error('Error loading PO detail:', err)
    });
  }

  closeDetail(): void {
    this.selectedPo = null;
  }

  openIssueModal(): void {
    this.issueRequest = { vendorQuotationId: '', amendmentsJson: '' };
    this.selectedCandidateId = null;
    this.issueCandidateError = null;
    this.showModal = true;
    this.refreshIssueCandidates();
  }

  closeModal(): void {
    this.showModal = false;
    this.isIssuing = false;
  }

  issuePurchaseOrder(): void {
    const quotationId = this.issueRequest.vendorQuotationId.trim();
    if (!quotationId) {
      this.issueCandidateError = 'Please select or enter a vendor quotation ID.';
      return;
    }

    this.issueRequest.vendorQuotationId = quotationId;
    const amendments = this.issueRequest.amendmentsJson?.trim();
    const payload: IssuePurchaseOrderRequest = {
      vendorQuotationId: quotationId,
      amendmentsJson: amendments ? amendments : undefined
    };

    this.isIssuing = true;
    this.poService.issue(payload).subscribe({
      next: (detail) => {
        this.isIssuing = false;
        this.showModal = false;
        this.selectedPo = detail;
        this.loadPOs();
        this.refreshIssueCandidates();
      },
      error: (err) => {
        this.isIssuing = false;
        console.error('Error issuing purchase order:', err);
        this.issueCandidateError = 'Issuing failed. Please verify the quotation and try again.';
      }
    });
  }

  acknowledgePO(id: string): void {
    this.poService.acknowledge(id).subscribe({
      next: () => {
        this.loadPOs();
        if (this.selectedPo?.id === id) {
          this.refreshDetail(id);
        }
      },
      error: (err) => console.error('Error acknowledging PO:', err)
    });
  }

  completePO(id: string): void {
    this.poService.complete(id).subscribe({
      next: () => {
        this.loadPOs();
        if (this.selectedPo?.id === id) {
          this.refreshDetail(id);
        }
      },
      error: (err) => console.error('Error completing PO:', err)
    });
  }

  private refreshDetail(id: string): void {
    this.poService.getById(id).subscribe({
      next: (detail) => this.selectedPo = detail,
      error: (err) => console.error('Error refreshing detail:', err)
    });
  }

  refreshIssueCandidates(): void {
    if (this.issueCandidatesLoading) {
      return;
    }

    this.issueCandidateError = null;
    this.issueCandidatesLoading = true;
    this.poService.getIssueCandidates().subscribe({
      next: (data) => {
        this.issueCandidates = data;
        this.issueCandidatesLoading = false;
        const manualId = this.issueRequest.vendorQuotationId?.trim();
        if (manualId && data.some(c => c.vendorQuotationId === manualId)) {
          this.selectedCandidateId = manualId;
        } else if (this.selectedCandidateId && !data.some(c => c.vendorQuotationId === this.selectedCandidateId)) {
          this.selectedCandidateId = null;
        }
        if (!this.selectedCandidateId && !manualId && data.length === 1) {
          this.selectedCandidateId = data[0].vendorQuotationId;
          this.issueRequest.vendorQuotationId = data[0].vendorQuotationId;
        }
      },
      error: (err) => {
        console.error('Error loading issue candidates:', err);
        this.issueCandidatesLoading = false;
        this.issueCandidateError = 'Unable to load quotations. You can still paste an ID manually.';
      }
    });
  }

  onCandidateSelected(candidateId: string | null): void {
    this.issueCandidateError = null;
    this.selectedCandidateId = candidateId && candidateId.length ? candidateId : null;
    if (this.selectedCandidateId) {
      this.issueRequest.vendorQuotationId = this.selectedCandidateId;
    } else if (!this.issueRequest.vendorQuotationId) {
      this.issueRequest.vendorQuotationId = '';
    }
  }

  onManualIdChange(value: string): void {
    const normalized = (value ?? '').trim();
    const match = this.issueCandidates.find(c => c.vendorQuotationId === normalized);
    this.selectedCandidateId = match ? match.vendorQuotationId : null;
    this.issueCandidateError = null;
  }
}

