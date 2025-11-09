import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RFQService,
  RfqSummary,
  RfqDetail,
  RfqStatus,
  RfqVendorStatus,
  CreateRfqRequest,
  UpdateRfqRequest,
  ConvertPrToRfqRequest
} from '../../services/rfq.service';
import { PurchaseRequisitionService, PurchaseRequisitionSummary, PurchaseRequisitionStatus, PurchaseRequisitionDetail } from '../../services/purchase-requisition.service';
import { VendorService, VendorSummary } from '../../services/vendor.service';

interface DraftItem {
  description: string;
  specification?: string;
  quantity: number;
  unit?: string;
}

interface DraftAttachment {
  fileName: string;
  storageUrl: string;
}

@Component({
  selector: 'app-rfq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="layout">
    <section class="panel list">
      <div class="panel-header">
        <h2>Requests for Quotation</h2>
        <button class="btn primary" (click)="toggleCreate()">{{ showCreateForm ? 'Close Form' : 'New RFQ' }}</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Status</th>
              <th>Due</th>
              <th>Vendors</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rfq of rfqs" (click)="selectRfq(rfq)" [class.selected]="rfq.id === selectedId">
              <td>{{ rfq.referenceNumber }}</td>
              <td>{{ rfq.title }}</td>
              <td><span class="chip" [class.published]="rfq.status === RfqStatus.Published" [class.closed]="rfq.status === RfqStatus.Closed" [class.draft]="rfq.status === RfqStatus.Draft">{{ statusLabel(rfq.status) }}</span></td>
              <td>{{ rfq.dueDate | date:'mediumDate' }}</td>
              <td>{{ rfq.vendorCount }}</td>
            </tr>
            <tr *ngIf="rfqs.length === 0">
              <td colspan="5" class="empty">No RFQs yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel detail">
      <div *ngIf="showCreateForm" class="card">
        <h3>Create RFQ</h3>
        <div class="section">
          <label class="checkbox">
            <input type="checkbox" [(ngModel)]="draft.usePurchaseRequisition" (change)="onUsePurchaseRequisitionToggle()" />
            Convert from approved purchase requisition
          </label>
          <div *ngIf="draft.usePurchaseRequisition" class="grid two">
            <label class="full">
              Purchase Requisition
              <select [(ngModel)]="draft.purchaseRequisitionId" (change)="onPurchaseRequisitionSelected()">
                <option value="">Select approved requisition</option>
                <option *ngFor="let pr of approvedRequisitions" [ngValue]="pr.id">
                  {{ pr.prNumber }} - {{ pr.title }}
                </option>
              </select>
            </label>
            <p class="hint full" *ngIf="selectedPr">Items will auto-populate from {{ selectedPr.prNumber }} once converted.</p>
          </div>
        </div>

        <div class="grid two">
          <label>
            Title
            <input type="text" [(ngModel)]="draft.title" />
          </label>
          <label>
            Due Date
            <input type="date" [(ngModel)]="draft.dueDate" />
          </label>
          <label class="full">
            Terms
            <textarea rows="3" [(ngModel)]="draft.terms"></textarea>
          </label>
        </div>

        <div class="section" *ngIf="!draft.usePurchaseRequisition">
          <h4>Items</h4>
          <table class="mini-table">
            <tr>
              <th>Description</th>
              <th>Specification</th>
              <th>Qty</th>
              <th>Unit</th>
              <th></th>
            </tr>
            <tr *ngFor="let item of draft.items; let i = index">
              <td><input type="text" [(ngModel)]="item.description" /></td>
              <td><input type="text" [(ngModel)]="item.specification" /></td>
              <td><input type="number" [(ngModel)]="item.quantity" min="1" /></td>
              <td><input type="text" [(ngModel)]="item.unit" /></td>
              <td><button class="btn danger" type="button" (click)="removeItem(i)" *ngIf="draft.items.length>1">Remove</button></td>
            </tr>
          </table>
          <button class="btn neutral" type="button" (click)="addItem()">+ Add Item</button>
        </div>

        <div class="section">
          <h4>Attachments</h4>
          <div *ngFor="let attachment of draft.attachments; let idx = index" class="attachment-row">
            <input type="text" placeholder="File name" [(ngModel)]="attachment.fileName" />
            <input type="text" placeholder="Storage URL" [(ngModel)]="attachment.storageUrl" />
            <button class="btn danger" type="button" (click)="removeAttachment(idx)">Remove</button>
          </div>
          <button class="btn neutral" type="button" (click)="addAttachment()">+ Add Attachment</button>
        </div>

        <div class="section">
          <h4>Select Vendors</h4>
          <div class="approver-list">
            <label *ngFor="let vendor of vendors">
              <input type="checkbox" [checked]="selectedVendorIds.has(vendor.id)" (change)="toggleVendor(vendor.id)" />
              {{ vendor.companyName }} ({{ vendor.email }})
            </label>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" type="button" (click)="createRfq()" [disabled]="creating">Create RFQ</button>
        </div>
      </div>

      <ng-container *ngIf="selected; else rfqPlaceholder">
        <div class="card">
          <h3>{{ selected.title }}</h3>
          <p class="meta">
            <span>Reference: {{ selected.referenceNumber }}</span>
            <span>Status: {{ statusLabel(selected.status) }}</span>
            <span>Due: {{ selected.dueDate | date:'medium' }}</span>
            <span *ngIf="selected.purchaseRequisitionNumber">Source PR: {{ selected.purchaseRequisitionNumber }}</span>
          </p>
          <p>{{ selected.terms || 'No terms provided.' }}</p>
          <div class="meta">
            <span>Created: {{ selected.createdAt | date:'medium' }}</span>
            <span *ngIf="selected.publishedAt">Published: {{ selected.publishedAt | date:'medium' }}</span>
            <span *ngIf="selected.closedAt">Closed: {{ selected.closedAt | date:'medium' }}</span>
          </div>
        </div>

        <div class="card">
          <h4>Items</h4>
          <table class="mini-table">
            <tr><th>Description</th><th>Specification</th><th>Qty</th><th>Unit</th></tr>
            <tr *ngFor="let item of selected.items">
              <td>{{ item.description }}</td>
              <td>{{ item.specification || '-' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unit || '-' }}</td>
            </tr>
          </table>
        </div>

        <div class="card">
          <h4>Attachments</h4>
          <p class="empty" *ngIf="selected.attachments.length===0">No attachments.</p>
          <ul *ngIf="selected.attachments.length">
            <li *ngFor="let attachment of selected.attachments">
              <a [href]="attachment.storageUrl" target="_blank">{{ attachment.fileName }}</a>
              <small>Uploaded {{ attachment.uploadedAt | date:'medium' }}</small>
            </li>
          </ul>
        </div>

        <div class="card">
          <h4>Vendor Invitations</h4>
          <table class="mini-table">
            <tr><th>Vendor</th><th>Status</th><th>Sent</th><th>Acknowledged</th><th>Quote</th><th>Notes</th></tr>
            <tr *ngFor="let vendor of selected.vendors">
              <td>{{ vendor.vendorName }}</td>
              <td>{{ vendorStatusLabel(vendor.status) }}</td>
              <td>{{ vendor.invitationSentAt ? (vendor.invitationSentAt | date:'short') : '-' }}</td>
              <td>{{ vendor.acknowledgedAt ? (vendor.acknowledgedAt | date:'short') : '-' }}</td>
              <td>{{ vendor.quoteSubmittedAt ? (vendor.quoteSubmittedAt | date:'short') : '-' }}</td>
              <td>{{ vendor.notes || '-' }}</td>
            </tr>
          </table>
        </div>

        <div class="actions">
          <button class="btn primary" (click)="publishSelected()" *ngIf="selected.status === RfqStatus.Draft">Publish</button>
          <button class="btn neutral" (click)="resendInvitations()" *ngIf="selected.status === RfqStatus.Published">Resend Invitations</button>
          <button class="btn primary" (click)="closeSelected()" *ngIf="selected.status === RfqStatus.Published">Close RFQ</button>
          <button class="btn danger" (click)="deleteSelected()">Delete</button>
        </div>
      </ng-container>

      <ng-template #rfqPlaceholder>
        <div class="empty-card">
          <p>Select an RFQ to review details or create a new one to get started.</p>
        </div>
      </ng-template>
    </section>
  </div>
  `,
  styles: [`
    :host { display:block; padding:2rem; }
    .layout { display:grid; grid-template-columns: 1fr 2fr; gap:1.5rem; align-items:start; }
    .panel { background:white; border-radius:12px; box-shadow:0 10px 30px rgba(15,23,42,0.08); padding:1.5rem; max-height:90vh; overflow-y:auto; }
    .panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .btn { border:none; border-radius:8px; padding:0.6rem 1.2rem; font-weight:600; cursor:pointer; transition:transform 0.1s; }
    .btn.primary { background:#2563eb; color:white; }
    .btn.neutral { background:#64748b; color:white; }
    .btn.danger { background:#dc2626; color:white; }
    .btn:disabled { opacity:0.5; cursor:not-allowed; }
    .table-wrapper { max-height:70vh; overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:0.75rem; border-bottom:1px solid #e5e7eb; text-align:left; }
    tbody tr { cursor:pointer; transition:background 0.2s; }
    tbody tr:hover { background:#f8fafc; }
    tbody tr.selected { background:#e0f2fe; }
    .chip { display:inline-block; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; text-transform:capitalize; background:#e5e7eb; color:#374151; }
    .chip.published { background:#dbeafe; color:#1e40af; }
    .chip.closed { background:#fee2e2; color:#991b1b; }
    .chip.draft { background:#fef3c7; color:#92400e; }
    .empty { text-align:center; padding:1rem; color:#9ca3af; }
    .card { background:#f9fafb; border-radius:12px; padding:1.25rem; box-shadow: inset 0 0 0 1px #e5e7eb; margin-bottom:1rem; }
    .card h3 { margin-top:0; }
    .meta { display:flex; flex-wrap:wrap; gap:1rem; font-size:0.85rem; color:#6b7280; margin:0.5rem 0; }
    .actions { display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:1rem; }
    .grid.two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
    .grid.two label { display:flex; flex-direction:column; gap:0.35rem; font-weight:600; color:#374151; }
    .grid.two input, .grid.two textarea, .grid.two select { border:1px solid #d1d5db; border-radius:8px; padding:0.6rem; font-size:1rem; }
    .grid.two .full { grid-column: span 2; }
    .mini-table th, .mini-table td { border-bottom:1px solid #dbeafe; padding:0.5rem; font-size:0.9rem; }
    .attachment-row { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)) auto; gap:0.5rem; margin-bottom:0.5rem; }
    .attachment-row input { border:1px solid #d1d5db; border-radius:8px; padding:0.5rem; }
    .approver-list { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:0.5rem; max-height:200px; overflow:auto; }
    .approver-list label { display:flex; align-items:center; gap:0.5rem; }
    .hint { font-size:0.85rem; color:#6b7280; margin-top:0.5rem; }
    .checkbox { display:flex; align-items:center; gap:0.5rem; font-weight:600; margin-bottom:0.75rem; }
    .empty-card { background:#f9fafb; border-radius:12px; padding:2rem; text-align:center; color:#6b7280; box-shadow: inset 0 0 0 1px #e5e7eb; }
    @media(max-width:1100px){ .layout { grid-template-columns:1fr; } .panel { max-height:none; } .approver-list { grid-template-columns:1fr; } }
  `]
})
export class RFQComponent implements OnInit {
  RfqStatus = RfqStatus;

  rfqs: RfqSummary[] = [];
  selected?: RfqDetail;
  selectedId: string | null = null;

  approvedRequisitions: PurchaseRequisitionSummary[] = [];
  selectedPr?: PurchaseRequisitionDetail;

  vendors: VendorSummary[] = [];
  selectedVendorIds = new Set<string>();

  showCreateForm = false;
  creating = false;

  draft = {
    usePurchaseRequisition: false,
    purchaseRequisitionId: '',
    title: '',
    terms: '',
    dueDate: this.defaultDueDate(),
    items: [
      { description: '', specification: '', quantity: 1, unit: '' }
    ] as DraftItem[],
    attachments: [] as DraftAttachment[]
  };

  constructor(
    private rfqService: RFQService,
    private prService: PurchaseRequisitionService,
    private vendorService: VendorService
  ) {}

  ngOnInit(): void {
    this.loadRfqs();
    this.loadApprovedRequisitions();
    this.loadVendors();
  }

  loadRfqs(): void {
    this.rfqService.list().subscribe({
      next: rfqs => this.rfqs = rfqs,
      error: err => console.error('Failed to load RFQs', err)
    });
  }

  loadApprovedRequisitions(): void {
    this.prService.list().subscribe({
      next: prs => this.approvedRequisitions = prs.filter(pr => pr.status === PurchaseRequisitionStatus.Approved),
      error: err => console.error('Failed to load requisitions', err)
    });
  }

  loadVendors(): void {
    this.vendorService.list().subscribe({
      next: vendors => this.vendors = vendors,
      error: err => console.error('Failed to load vendors', err)
    });
  }

  toggleCreate(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  onUsePurchaseRequisitionToggle(): void {
    if (!this.draft.usePurchaseRequisition) {
      this.draft.purchaseRequisitionId = '';
      this.selectedPr = undefined;
    }
  }

  onPurchaseRequisitionSelected(): void {
    if (!this.draft.purchaseRequisitionId) {
      this.selectedPr = undefined;
      return;
    }
    this.prService.get(this.draft.purchaseRequisitionId).subscribe({
      next: pr => this.selectedPr = pr,
      error: err => console.error('Failed to load requisition detail', err)
    });
  }

  addItem(): void {
    this.draft.items.push({ description: '', specification: '', quantity: 1, unit: '' });
  }

  removeItem(index: number): void {
    this.draft.items.splice(index, 1);
  }

  addAttachment(): void {
    this.draft.attachments.push({ fileName: '', storageUrl: '' });
  }

  removeAttachment(index: number): void {
    this.draft.attachments.splice(index, 1);
  }

  toggleVendor(vendorId: string): void {
    if (this.selectedVendorIds.has(vendorId)) {
      this.selectedVendorIds.delete(vendorId);
    } else {
      this.selectedVendorIds.add(vendorId);
    }
  }

  createRfq(): void {
    if (!this.draft.title || !this.draft.dueDate || this.selectedVendorIds.size === 0) {
      alert('Title, due date, and at least one vendor are required.');
      return;
    }
    this.creating = true;

    if (this.draft.usePurchaseRequisition) {
      if (!this.draft.purchaseRequisitionId) {
        alert('Select a purchase requisition to convert.');
        this.creating = false;
        return;
      }
      const payload: ConvertPrToRfqRequest = {
        purchaseRequisitionId: this.draft.purchaseRequisitionId,
        title: this.draft.title,
        terms: this.draft.terms,
        dueDate: this.draft.dueDate,
        attachments: this.draft.attachments.map(att => ({ fileName: att.fileName, storageUrl: att.storageUrl })),
        vendors: Array.from(this.selectedVendorIds).map(id => ({ vendorId: id }))
      };
      this.rfqService.convert(payload).subscribe({
        next: detail => this.handleCreateSuccess(detail),
        error: err => this.handleCreateError(err)
      });
    } else {
      if (this.draft.items.some(item => !item.description || item.quantity <= 0)) {
        alert('Provide item description and quantity.');
        this.creating = false;
        return;
      }
      const payload: CreateRfqRequest = {
        title: this.draft.title,
        terms: this.draft.terms,
        dueDate: this.draft.dueDate,
        purchaseRequisitionId: undefined,
        items: this.draft.items.map(item => ({
          description: item.description,
          specification: item.specification,
          quantity: Number(item.quantity),
          unit: item.unit
        })),
        attachments: this.draft.attachments.map(att => ({ fileName: att.fileName, storageUrl: att.storageUrl })),
        vendors: Array.from(this.selectedVendorIds).map(id => ({ vendorId: id }))
      };
      this.rfqService.create(payload).subscribe({
        next: detail => this.handleCreateSuccess(detail),
        error: err => this.handleCreateError(err)
      });
    }
  }

  handleCreateSuccess(detail: RfqDetail): void {
    this.creating = false;
    this.resetDraft();
    this.showCreateForm = false;
    this.loadRfqs();
    this.selectRfq(detail);
  }

  handleCreateError(err: any): void {
    this.creating = false;
    console.error('Failed to create RFQ', err);
    alert('Unable to create RFQ. Please verify fields and try again.');
  }

  selectRfq(rfq: RfqSummary | RfqDetail): void {
    this.selectedId = rfq.id;
    this.rfqService.detail(rfq.id).subscribe({
      next: detail => this.selected = detail,
      error: err => console.error('Failed to load RFQ detail', err)
    });
  }

  publishSelected(): void {
    if (!this.selected) { return; }
    this.rfqService.publish(this.selected.id).subscribe({
      next: () => this.refreshSelected(),
      error: err => {
        console.error('Failed to publish RFQ', err);
        alert('Unable to publish RFQ. Ensure it is in draft status.');
      }
    });
  }

  closeSelected(): void {
    if (!this.selected) { return; }
    this.rfqService.close(this.selected.id).subscribe({
      next: () => this.refreshSelected(),
      error: err => {
        console.error('Failed to close RFQ', err);
        alert('Unable to close RFQ.');
      }
    });
  }

  resendInvitations(): void {
    if (!this.selected) { return; }
    const pendingVendorIds = this.selected.vendors
      .filter(v => v.status === RfqVendorStatus.Pending || v.status === RfqVendorStatus.InvitationSent)
      .map(v => v.vendorId);
    if (pendingVendorIds.length === 0) {
      alert('No pending vendors to resend.');
      return;
    }
    this.rfqService.resendInvitations(this.selected.id, pendingVendorIds).subscribe({
      next: () => this.refreshSelected(),
      error: err => {
        console.error('Failed to resend invitations', err);
        alert('Unable to resend invitations.');
      }
    });
  }

  deleteSelected(): void {
    if (!this.selected) { return; }
    if (!confirm('Delete this RFQ?')) { return; }
    this.rfqService.delete(this.selected.id).subscribe({
      next: () => {
        this.selected = undefined;
        this.selectedId = null;
        this.loadRfqs();
      },
      error: err => {
        console.error('Failed to delete RFQ', err);
        alert('Unable to delete RFQ.');
      }
    });
  }

  refreshSelected(): void {
    if (!this.selectedId) { return; }
    this.rfqService.detail(this.selectedId).subscribe({
      next: detail => {
        this.selected = detail;
        this.loadRfqs();
      },
      error: err => console.error('Failed to refresh RFQ detail', err)
    });
  }

  statusLabel(status: RfqStatus): string {
    switch (status) {
      case RfqStatus.Draft: return 'Draft';
      case RfqStatus.Published: return 'Published';
      case RfqStatus.Closed: return 'Closed';
      case RfqStatus.Awarded: return 'Awarded';
      default: return 'Unknown';
    }
  }

  vendorStatusLabel(status: RfqVendorStatus): string {
    switch (status) {
      case RfqVendorStatus.Pending: return 'Pending';
      case RfqVendorStatus.InvitationSent: return 'Invitation Sent';
      case RfqVendorStatus.Acknowledged: return 'Acknowledged';
      case RfqVendorStatus.QuoteSubmitted: return 'Quote Submitted';
      case RfqVendorStatus.Declined: return 'Declined';
      default: return 'Unknown';
    }
  }

  defaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  resetDraft(): void {
    this.draft = {
      usePurchaseRequisition: false,
      purchaseRequisitionId: '',
      title: '',
      terms: '',
      dueDate: this.defaultDueDate(),
      items: [
        { description: '', specification: '', quantity: 1, unit: '' }
      ],
      attachments: []
    };
    this.selectedVendorIds.clear();
    this.selectedPr = undefined;
  }
}
