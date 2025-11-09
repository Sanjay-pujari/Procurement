import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PurchaseRequisitionService,
  PurchaseRequisitionSummary,
  PurchaseRequisitionDetail,
  PurchaseRequisitionUrgency,
  PurchaseRequisitionStatus,
  PurchaseRequisitionApprovalStatus,
  PurchaseRequisitionItem,
  CreatePurchaseRequisitionRequest,
  SubmitPurchaseRequisitionRequest
} from '../../services/purchase-requisition.service';
import { User, UserManagementService } from '../../services/user-management.service';

interface DraftItem {
  itemName: string;
  specification?: string;
  quantity: number;
  unitOfMeasure?: string;
  estimatedUnitCost: number;
}

interface DraftAttachment {
  fileName: string;
  storageUrl: string;
}

@Component({
    selector: 'app-purchase-requisitions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
  <div class="layout">
    <section class="panel list">
      <div class="panel-header">
        <h2>Purchase Requisitions</h2>
        <button class="btn primary" (click)="toggleCreate()">
          {{ showCreateForm ? 'Close Form' : 'New Requisition' }}
        </button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>PR #</th>
              <th>Title</th>
              <th>Status</th>
              <th>Urgency</th>
              <th>Needed By</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pr of requisitions" (click)="selectRequisition(pr)" [class.selected]="pr.id === selectedRequisitionId">
              <td>{{ pr.prNumber }}</td>
              <td>{{ pr.title }}</td>
              <td><span class="chip" [class.approved]="pr.status === PurchaseRequisitionStatus.Approved" [class.rejected]="pr.status === PurchaseRequisitionStatus.Rejected" [class.pending]="pr.status === PurchaseRequisitionStatus.PendingApproval">{{ statusLabel(pr.status) }}</span></td>
              <td>{{ urgencyLabel(pr.urgency) }}</td>
              <td>{{ pr.neededBy | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="requisitions.length === 0">
              <td colspan="5" class="empty">No purchase requisitions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel detail">
      <div *ngIf="showCreateForm" class="card">
        <h3>Create Purchase Requisition</h3>
        <div class="grid two">
          <label>
            Title
            <input type="text" [(ngModel)]="draft.title" required />
          </label>
          <label>
            Cost Center
            <input type="text" [(ngModel)]="draft.costCenter" required />
          </label>
          <label>
            Department
            <input type="text" [(ngModel)]="draft.department" />
          </label>
          <label>
            Needed By
            <input type="date" [(ngModel)]="draft.neededBy" />
          </label>
          <label>
            Urgency
            <select [(ngModel)]="draft.urgency">
              <option *ngFor="let opt of urgencyOptions" [ngValue]="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label class="full">
            Description
            <textarea rows="3" [(ngModel)]="draft.description"></textarea>
          </label>
        </div>

        <div class="section">
          <h4>Items</h4>
          <table class="mini-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specification</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Estimated Cost</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of draft.items; let i = index">
                <td><input type="text" [(ngModel)]="item.itemName" required /></td>
                <td><input type="text" [(ngModel)]="item.specification" /></td>
                <td><input type="number" [(ngModel)]="item.quantity" min="1" /></td>
                <td><input type="text" [(ngModel)]="item.unitOfMeasure" /></td>
                <td><input type="number" [(ngModel)]="item.estimatedUnitCost" min="0" step="0.01" /></td>
                <td><button class="btn danger" type="button" (click)="removeItem(i)" *ngIf="draft.items.length > 1">Remove</button></td>
              </tr>
            </tbody>
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
          <h4>Approvers</h4>
          <p class="hint">Select users who should approve in sequence (top to bottom).</p>
          <div class="approver-list">
            <label *ngFor="let user of approvers">
              <input type="checkbox" [checked]="isApproverSelected(user.id)" (change)="toggleApprover(user.id)" />
              {{ user.displayName || user.email }} ({{ user.email }})
            </label>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" type="button" (click)="createRequisition()" [disabled]="creating">Create & Submit</button>
        </div>
      </div>

      <ng-container *ngIf="selected; else emptyState">
        <div class="card">
          <h3>{{ selected.title }}</h3>
          <p class="meta">
            <span>PR #: {{ selected.prNumber }}</span>
            <span>Status: {{ statusLabel(selected.status) }}</span>
            <span>Urgency: {{ urgencyLabel(selected.urgency) }}</span>
            <span>Needed by: {{ selected.neededBy | date:'mediumDate' }}</span>
          </p>
          <p>{{ selected.description || 'No description provided.' }}</p>
          <div class="meta">
            <span>Cost Center: {{ selected.costCenter }}</span>
            <span>Department: {{ selected.department || '-' }}</span>
            <span>Requested: {{ selected.createdAt | date:'medium' }}</span>
          </div>
        </div>

        <div class="card">
          <h4>Items</h4>
          <table class="mini-table">
            <tr>
              <th>Name</th>
              <th>Specification</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Estimated Cost</th>
            </tr>
            <tr *ngFor="let item of selected.items">
              <td>{{ item.itemName }}</td>
              <td>{{ item.specification || '-' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitOfMeasure || '-' }}</td>
              <td>{{ item.estimatedUnitCost | currency }}</td>
            </tr>
          </table>
        </div>

        <div class="card">
          <h4>Attachments</h4>
          <p *ngIf="selected.attachments.length === 0" class="empty">No attachments uploaded.</p>
          <ul *ngIf="selected.attachments.length">
            <li *ngFor="let attachment of selected.attachments">
              <a [href]="attachment.storageUrl" target="_blank" rel="noopener">{{ attachment.fileName }}</a>
              <small>Uploaded {{ attachment.uploadedAt | date:'medium' }}</small>
            </li>
          </ul>
        </div>

        <div class="card">
          <h4>Approvals</h4>
          <table class="mini-table">
            <tr>
              <th>Sequence</th>
              <th>Approver</th>
              <th>Status</th>
              <th>Actioned</th>
              <th>Comments</th>
            </tr>
            <tr *ngFor="let approval of selected.approvals">
              <td>{{ approval.sequence }}</td>
              <td>{{ approval.approverUserId }}</td>
              <td>{{ approvalStatusLabel(approval.status) }}</td>
              <td>{{ approval.actionedAt ? (approval.actionedAt | date:'medium') : '-' }}</td>
              <td>{{ approval.comments || '-' }}</td>
            </tr>
          </table>
        </div>

        <div class="actions">
          <button class="btn primary" (click)="submitDraft()" *ngIf="selected.status === PurchaseRequisitionStatus.Draft">Submit for Approval</button>
          <button class="btn primary" (click)="approveSelected()" *ngIf="selected.status === PurchaseRequisitionStatus.PendingApproval">Approve</button>
          <button class="btn danger" (click)="rejectSelected()" *ngIf="selected.status === PurchaseRequisitionStatus.PendingApproval">Reject</button>
        </div>
      </ng-container>

      <ng-template #emptyState>
        <div class="empty-card">
          <p>Select a purchase requisition to review details, or create a new one.</p>
        </div>
      </ng-template>
    </section>
  </div>
  `,
    styles: [`
    :host { display: block; padding: 2rem; }
    .layout { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; align-items: start; }
    .panel { background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); padding: 1.5rem; max-height: 90vh; overflow-y: auto; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    tbody tr { cursor: pointer; transition: background 0.2s; }
    tbody tr:hover { background: #f8fafc; }
    tbody tr.selected { background: #e0f2fe; }
    .chip { display:inline-block; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; background:#f5f5f5; color:#374151; text-transform:capitalize; }
    .chip.pending { background:#fef3c7; color:#92400e; }
    .chip.approved { background:#dcfce7; color:#166534; }
    .chip.rejected { background:#fee2e2; color:#991b1b; }
    .empty { text-align:center; padding:1rem; color:#9ca3af; }
    .card { background:#f9fafb; border-radius:12px; padding:1.25rem; box-shadow: inset 0 0 0 1px #e5e7eb; margin-bottom:1rem; }
    .card h3 { margin-top:0; }
    .card h4 { margin-top:0; margin-bottom:0.75rem; }
    .meta { display:flex; flex-wrap:wrap; gap:1rem; font-size:0.85rem; color:#6b7280; margin:0.5rem 0; }
    .actions { display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:1rem; }
    .btn { border:none; border-radius:8px; padding:0.6rem 1.2rem; font-weight:600; cursor:pointer; transition: transform 0.1s; }
    .btn.primary { background:#2563eb; color:white; }
    .btn.danger { background:#dc2626; color:white; }
    .btn.neutral { background:#64748b; color:white; }
    .btn:disabled { opacity:0.5; cursor:not-allowed; }
    .btn:hover:not(:disabled) { transform:translateY(-1px); }
    .grid.two { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:1rem; }
    .grid.two label { display:flex; flex-direction:column; gap:0.35rem; font-weight:600; color:#374151; }
    .grid.two input, .grid.two textarea, .grid.two select { border:1px solid #d1d5db; border-radius:8px; padding:0.6rem; font-size:1rem; }
    .grid.two .full { grid-column: span 2; }
    .mini-table th, .mini-table td { border-bottom:1px solid #dbeafe; padding:0.5rem; font-size:0.9rem; }
    .section { margin-top:1.5rem; }
    .attachment-row { display:grid; grid-template-columns: repeat(2, 1fr) auto; gap:0.5rem; margin-bottom:0.5rem; }
    .attachment-row input { border:1px solid #d1d5db; border-radius:8px; padding:0.5rem; }
    .approver-list { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:0.5rem; max-height:200px; overflow:auto; }
    .approver-list label { display:flex; align-items:center; gap:0.5rem; font-weight:500; }
    .hint { font-size:0.85rem; color:#6b7280; margin-bottom:0.5rem; }
    .empty-card { background:#f9fafb; border-radius:12px; padding:2rem; text-align:center; color:#6b7280; box-shadow: inset 0 0 0 1px #e5e7eb; }
    @media (max-width:1100px){
      .layout { grid-template-columns:1fr; }
      .panel { max-height:none; }
      .approver-list { grid-template-columns:1fr; }
    }
  `]
})
export class PurchaseRequisitionsComponent {
  PurchaseRequisitionStatus = PurchaseRequisitionStatus;
  PurchaseRequisitionApprovalStatus = PurchaseRequisitionApprovalStatus;

  requisitions: PurchaseRequisitionSummary[] = [];
  selected?: PurchaseRequisitionDetail;
  selectedRequisitionId: string | null = null;

  showCreateForm = false;
  creating = false;
  approvers: User[] = [];
  selectedApproverIds = new Set<string>();

  urgencyOptions = [
    { value: PurchaseRequisitionUrgency.Low, label: 'Low' },
    { value: PurchaseRequisitionUrgency.Medium, label: 'Medium' },
    { value: PurchaseRequisitionUrgency.High, label: 'High' },
    { value: PurchaseRequisitionUrgency.Critical, label: 'Critical' }
  ];

  draft = {
    title: '',
    description: '',
    costCenter: '',
    department: '',
    urgency: PurchaseRequisitionUrgency.Medium,
    neededBy: this.defaultNeededBy(),
    items: [
      { itemName: '', specification: '', quantity: 1, unitOfMeasure: '', estimatedUnitCost: 0 }
    ] as DraftItem[],
    attachments: [] as DraftAttachment[]
  };

  constructor(
    private prService: PurchaseRequisitionService,
    private userService: UserManagementService
  ) {}

  ngOnInit(): void {
    this.loadRequisitions();
    this.loadApprovers();
  }

  loadRequisitions(): void {
    this.prService.list().subscribe({
      next: prs => this.requisitions = prs,
      error: err => console.error('Failed to load purchase requisitions', err)
    });
  }

  loadApprovers(): void {
    this.userService.getAllUsers().subscribe({
      next: users => this.approvers = users.filter(u => u.roles.includes('Approver') || u.roles.includes('Admin') || u.roles.includes('ProcurementManager')),
      error: err => console.error('Failed to load users', err)
    });
  }

  toggleCreate(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  addItem(): void {
    this.draft.items.push({ itemName: '', specification: '', quantity: 1, unitOfMeasure: '', estimatedUnitCost: 0 });
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

  isApproverSelected(userId: string): boolean {
    return this.selectedApproverIds.has(userId);
  }

  toggleApprover(userId: string): void {
    if (this.selectedApproverIds.has(userId)) {
      this.selectedApproverIds.delete(userId);
    } else {
      this.selectedApproverIds.add(userId);
    }
  }

  createRequisition(): void {
    if (!this.draft.title || !this.draft.costCenter || this.selectedApproverIds.size === 0) {
      alert('Title, cost center, and at least one approver are required.');
      return;
    }

    const payload: CreatePurchaseRequisitionRequest = {
      title: this.draft.title,
      description: this.draft.description,
      costCenter: this.draft.costCenter,
      department: this.draft.department,
      urgency: this.draft.urgency,
      neededBy: this.draft.neededBy,
      items: this.draft.items.map(item => ({
        itemName: item.itemName,
        specification: item.specification,
        quantity: Number(item.quantity),
        unitOfMeasure: item.unitOfMeasure,
        estimatedUnitCost: Number(item.estimatedUnitCost)
      })),
      attachments: this.draft.attachments.map(att => ({ fileName: att.fileName, storageUrl: att.storageUrl })),
      approverUserIds: Array.from(this.selectedApproverIds)
    };

    this.creating = true;
    this.prService.create(payload).subscribe({
      next: detail => {
        this.prService.submit(detail.id, { approverUserIds: payload.approverUserIds } as SubmitPurchaseRequisitionRequest).subscribe({
          next: () => {
            this.creating = false;
            this.resetDraft();
            this.showCreateForm = false;
            this.loadRequisitions();
            this.selectRequisition(detail);
          },
          error: err => {
            this.creating = false;
            console.error('Failed to submit purchase requisition', err);
            alert('Requisition saved but submission failed. Please submit manually from the detail pane.');
            this.loadRequisitions();
            this.selectRequisition(detail);
          }
        });
      },
      error: err => {
        this.creating = false;
        console.error('Failed to create purchase requisition', err);
        alert('Unable to create purchase requisition. Check required fields and try again.');
      }
    });
  }

  selectRequisition(pr: PurchaseRequisitionSummary | PurchaseRequisitionDetail): void {
    this.selectedRequisitionId = pr.id;
    this.prService.get(pr.id).subscribe({
      next: detail => this.selected = detail,
      error: err => console.error('Failed to load purchase requisition detail', err)
    });
  }

  submitDraft(): void {
    if (!this.selected) { return; }

    const approvers = this.selected.approvals
      .sort((a, b) => a.sequence - b.sequence)
      .map(a => a.approverUserId);

    this.prService.submit(this.selected.id, { approverUserIds: approvers }).subscribe({
      next: () => this.refreshSelected(),
      error: err => {
        console.error('Failed to submit requisition', err);
        alert('Unable to submit requisition. Check that approvers are configured.');
      }
    });
  }

  approveSelected(): void {
    if (!this.selected) { return; }
    this.prService.approve(this.selected.id, { comments: '' }).subscribe({
      next: () => this.refreshSelected(),
      error: err => {
        console.error('Failed to approve requisition', err);
        alert('Approval failed. Ensure you are the current approver.');
      }
    });
  }

  rejectSelected(): void {
    if (!this.selected) { return; }
    const comments = prompt('Provide rejection comments (optional):') || '';
    this.prService.reject(this.selected.id, { comments }).subscribe({
      next: () => this.refreshSelected(),
      error: err => {
        console.error('Failed to reject requisition', err);
        alert('Rejection failed. Ensure you are the current approver.');
      }
    });
  }

  refreshSelected(): void {
    if (!this.selectedRequisitionId) { return; }
    this.prService.get(this.selectedRequisitionId).subscribe({
      next: detail => {
        this.selected = detail;
        this.loadRequisitions();
      },
      error: err => console.error('Failed to refresh requisition', err)
    });
  }

  statusLabel(status: PurchaseRequisitionStatus): string {
    switch (status) {
      case PurchaseRequisitionStatus.Draft: return 'Draft';
      case PurchaseRequisitionStatus.PendingApproval: return 'Pending Approval';
      case PurchaseRequisitionStatus.Approved: return 'Approved';
      case PurchaseRequisitionStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  approvalStatusLabel(status: PurchaseRequisitionApprovalStatus): string {
    switch (status) {
      case PurchaseRequisitionApprovalStatus.NotStarted: return 'Not Started';
      case PurchaseRequisitionApprovalStatus.Pending: return 'Pending';
      case PurchaseRequisitionApprovalStatus.Approved: return 'Approved';
      case PurchaseRequisitionApprovalStatus.Rejected: return 'Rejected';
      case PurchaseRequisitionApprovalStatus.Skipped: return 'Skipped';
      default: return 'Unknown';
    }
  }

  urgencyLabel(urgency: PurchaseRequisitionUrgency): string {
    switch (urgency) {
      case PurchaseRequisitionUrgency.Low: return 'Low';
      case PurchaseRequisitionUrgency.Medium: return 'Medium';
      case PurchaseRequisitionUrgency.High: return 'High';
      case PurchaseRequisitionUrgency.Critical: return 'Critical';
      default: return 'Unknown';
    }
  }

  defaultNeededBy(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  resetDraft(): void {
    this.draft = {
      title: '',
      description: '',
      costCenter: '',
      department: '',
      urgency: PurchaseRequisitionUrgency.Medium,
      neededBy: this.defaultNeededBy(),
      items: [
        { itemName: '', specification: '', quantity: 1, unitOfMeasure: '', estimatedUnitCost: 0 }
      ],
      attachments: []
    };
    this.selectedApproverIds.clear();
  }
}


