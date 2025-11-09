import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VendorService,
  VendorSummary,
  VendorDetail,
  VendorVerificationStatus
} from '../../services/vendor.service';

@Component({
    selector: 'app-vendors',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
  <div class="layout">
    <section class="panel list">
      <div class="panel-header">
        <h2>Vendors</h2>
        <p class="subtitle">Monitor verification, KYC and lifecycle history</p>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Status</th>
              <th>Category</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let vendor of vendors" (click)="selectVendor(vendor)" [class.selected]="vendor.id === selectedVendorId">
              <td>
                <div class="title">{{ vendor.companyName }}</div>
                <small>{{ vendor.email }}</small>
              </td>
              <td>
                <span class="chip"
                      [class.active]="vendor.isActive"
                      [class.pending]="vendor.verificationStatus === verificationStatus.PendingReview"
                      [class.suspended]="vendor.verificationStatus === verificationStatus.Suspended"
                      [class.blacklisted]="vendor.verificationStatus === verificationStatus.Blacklisted">
                  {{ statusLabel(vendor.verificationStatus) }}
                </span>
              </td>
              <td>{{ vendor.category || '-' }}</td>
              <td>{{ vendor.createdAt | date: 'mediumDate' }}</td>
            </tr>
            <tr *ngIf="vendors.length === 0">
              <td colspan="4" class="empty">No vendors found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel detail" *ngIf="selectedVendor">
      <div class="panel-header">
        <h2>{{ selectedVendor.vendor.companyName }}</h2>
        <p class="subtitle">{{ selectedVendor.vendor.email }}</p>
      </div>

      <div class="quick-stats">
        <div>
          <h4>Status</h4>
          <span class="chip"
                [class.active]="selectedVendor.vendor.isActive"
                [class.pending]="selectedVendor.vendor.verificationStatus === verificationStatus.PendingReview"
                [class.suspended]="selectedVendor.vendor.verificationStatus === verificationStatus.Suspended"
                [class.blacklisted]="selectedVendor.vendor.verificationStatus === verificationStatus.Blacklisted">
            {{ statusLabel(selectedVendor.vendor.verificationStatus) }}
          </span>
        </div>
        <div>
          <h4>Performance</h4>
          <span>{{ selectedVendor.vendor.performanceRating | number: '1.1-2' }}</span>
        </div>
        <div>
          <h4>Purchase Orders</h4>
          <span>{{ selectedVendor.history.purchaseOrders.length }}</span>
        </div>
        <div>
          <h4>Invoices</h4>
          <span>{{ selectedVendor.history.invoices.length }}</span>
        </div>
      </div>

      <div class="actions">
        <h3>Lifecycle Actions</h3>
        <div class="action-buttons">
          <button class="btn primary" (click)="approveVendor()" [disabled]="selectedVendor.vendor.verificationStatus === verificationStatus.Approved">Approve</button>
          <button class="btn warn" (click)="rejectVendor()">Reject</button>
          <button class="btn neutral" (click)="reinstateVendor()" [disabled]="selectedVendor.vendor.verificationStatus === verificationStatus.Approved">Reinstate</button>
          <button class="btn danger" (click)="suspendVendor()">Suspend</button>
          <button class="btn danger" (click)="blacklistVendor()">Blacklist</button>
        </div>
        <div class="remarks">
          <label>Remarks</label>
          <textarea [(ngModel)]="remarks" placeholder="Add context for lifecycle changes"></textarea>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>KYC Documents</h3>
          <ul *ngIf="selectedVendor.documents.length; else noDocs">
            <li *ngFor="let doc of selectedVendor.documents">
              <div>
                <strong>{{ doc.documentType }}</strong>
                <p>{{ doc.fileName }}</p>
                <small>{{ doc.uploadedAt | date: 'medium' }}</small>
              </div>
              <a [href]="doc.storageUrl" target="_blank" rel="noopener">View</a>
            </li>
          </ul>
          <ng-template #noDocs>
            <p class="empty">No KYC documents uploaded yet.</p>
          </ng-template>
        </div>

        <div class="card">
          <h3>Status History</h3>
          <ul *ngIf="selectedVendor.statusChanges.length; else noHistory">
            <li *ngFor="let entry of selectedVendor.statusChanges">
              <div>
                <strong>{{ statusLabel(entry.status) }}</strong>
                <small>{{ entry.changedAt | date: 'medium' }}</small>
                <p *ngIf="entry.remarks">{{ entry.remarks }}</p>
              </div>
            </li>
          </ul>
          <ng-template #noHistory>
            <p class="empty">No lifecycle changes recorded.</p>
          </ng-template>
        </div>
      </div>

      <div class="card">
        <h3>Purchase Orders</h3>
        <table class="mini-table" *ngIf="selectedVendor.history.purchaseOrders.length; else noPo">
          <tr>
            <th>PO Number</th>
            <th>Status</th>
            <th>Issued</th>
            <th>Completed</th>
          </tr>
          <tr *ngFor="let po of selectedVendor.history.purchaseOrders">
            <td>{{ po.purchaseOrderNumber }}</td>
            <td>{{ po.status }}</td>
            <td>{{ po.createdAt | date:'short' }}</td>
            <td>{{ po.completedAt ? (po.completedAt | date:'short') : '—' }}</td>
          </tr>
        </table>
        <ng-template #noPo>
          <p class="empty">No purchase orders recorded.</p>
        </ng-template>
      </div>

      <div class="card">
        <h3>Invoices</h3>
        <table class="mini-table" *ngIf="selectedVendor.history.invoices.length; else noInvoices">
          <tr>
            <th>ID</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr>
          <tr *ngFor="let invoice of selectedVendor.history.invoices">
            <td>{{ invoice.id }}</td>
            <td>{{ invoice.amount | currency }}</td>
            <td>{{ invoice.paymentStatus }}</td>
            <td>{{ invoice.submittedAt | date:'short' }}</td>
          </tr>
        </table>
        <ng-template #noInvoices>
          <p class="empty">No invoices submitted.</p>
        </ng-template>
      </div>
    </section>
  </div>
  `,
    styles: [`
    :host { display: block; padding: 2rem; }
    .layout { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; align-items: start; }
    .panel { background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); padding: 1.5rem; }
    .panel-header { margin-bottom: 1.5rem; }
    .panel-header h2 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0; color: #6b7280; }
    .table-wrapper { max-height: 70vh; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #edeff5; }
    tbody tr { cursor: pointer; transition: background 0.2s; }
    tbody tr:hover { background: #f8fafc; }
    tbody tr.selected { background: #e0f2fe; }
    .title { font-weight: 600; }
    .chip { display:inline-block; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; background:#f5f5f5; color:#374151; text-transform:capitalize; font-weight:600; letter-spacing:0.02em; }
    .chip.active { background:#dcfce7; color:#166534; }
    .chip.pending { background:#fef3c7; color:#92400e; }
    .chip.suspended { background:#fee2e2; color:#b91c1c; }
    .chip.blacklisted { background:#1f2937; color:#f9fafb; }
    .empty { text-align:center; padding:1rem; color:#9ca3af; }
    .detail .quick-stats { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:1rem; margin-bottom:2rem; }
    .quick-stats div { background:#f9fafb; border-radius:12px; padding:1rem; }
    .quick-stats h4 { margin:0 0 0.25rem; font-size:0.85rem; color:#6b7280; text-transform:uppercase; letter-spacing:0.1em; }
    .quick-stats span { font-size:1.25rem; font-weight:600; color:#1f2937; }
    .actions { margin-bottom:2rem; }
    .actions h3 { margin:0 0 0.5rem; }
    .action-buttons { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem; }
    .btn { border:none; border-radius:8px; padding:0.6rem 1.2rem; font-weight:600; cursor:pointer; transition: transform 0.1s; }
    .btn:disabled { opacity:0.5; cursor:not-allowed; }
    .btn:hover:not(:disabled) { transform:translateY(-1px); }
    .btn.primary { background:#2563eb; color:white; }
    .btn.warn { background:#f97316; color:white; }
    .btn.neutral { background:#64748b; color:white; }
    .btn.danger { background:#dc2626; color:white; }
    .remarks textarea { width:100%; min-height:80px; border:1px solid #e5e7eb; border-radius:8px; padding:0.75rem; resize:vertical; }
    .grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:1rem; margin-bottom:1.5rem; }
    .card { background:#f8fafc; border-radius:12px; padding:1.25rem; box-shadow: inset 0 0 0 1px #e5e7eb; }
    .card h3 { margin-top:0; }
    .card ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.75rem; }
    .card li { display:flex; justify-content:space-between; gap:1rem; }
    .card li div { max-width:70%; }
    .mini-table { border-collapse:collapse; width:100%; }
    .mini-table th, .mini-table td { border-bottom:1px solid #dbeafe; padding:0.5rem; font-size:0.9rem; }
    @media (max-width:1100px){
      .layout { grid-template-columns:1fr; }
      .detail .quick-stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .grid { grid-template-columns:1fr; }
    }
  `]
})
export class VendorsComponent {
  vendors: VendorSummary[] = [];
  selectedVendor?: VendorDetail;
  selectedVendorId: string | null = null;
  remarks = '';
  verificationStatus = VendorVerificationStatus;

  constructor(private vendorService: VendorService) {}

  ngOnInit(): void {
    this.loadVendors();
  }

  loadVendors(): void {
    this.vendorService.list().subscribe({
      next: (vendors) => this.vendors = vendors,
      error: (err) => console.error('Failed to load vendors', err)
    });
  }

  selectVendor(vendor: VendorSummary): void {
    this.selectedVendorId = vendor.id;
    this.vendorService.getDetail(vendor.id).subscribe({
      next: (detail) => { this.selectedVendor = detail; },
      error: (err) => console.error('Failed to load vendor detail', err)
    });
  }

  approveVendor(): void {
    if (!this.selectedVendor) { return; }
    this.vendorService.review(this.selectedVendor.vendor.id, { status: VendorVerificationStatus.Approved, remarks: this.remarks }).subscribe({
      next: () => { this.refreshAfterAction(); },
      error: (err) => console.error('Failed to approve vendor', err)
    });
  }

  rejectVendor(): void {
    if (!this.selectedVendor) { return; }
    this.vendorService.review(this.selectedVendor.vendor.id, { status: VendorVerificationStatus.Rejected, remarks: this.remarks }).subscribe({
      next: () => { this.refreshAfterAction(); },
      error: (err) => console.error('Failed to reject vendor', err)
    });
  }

  suspendVendor(): void {
    if (!this.selectedVendor) { return; }
    this.vendorService.suspend(this.selectedVendor.vendor.id, { remarks: this.remarks }).subscribe({
      next: () => { this.refreshAfterAction(); },
      error: (err) => console.error('Failed to suspend vendor', err)
    });
  }

  blacklistVendor(): void {
    if (!this.selectedVendor) { return; }
    this.vendorService.blacklist(this.selectedVendor.vendor.id, { remarks: this.remarks }).subscribe({
      next: () => { this.refreshAfterAction(); },
      error: (err) => console.error('Failed to blacklist vendor', err)
    });
  }

  reinstateVendor(): void {
    if (!this.selectedVendor) { return; }
    this.vendorService.reinstate(this.selectedVendor.vendor.id, { remarks: this.remarks }).subscribe({
      next: () => { this.refreshAfterAction(); },
      error: (err) => console.error('Failed to reinstate vendor', err)
    });
  }

  private refreshAfterAction(): void {
    this.remarks = '';
    if (this.selectedVendorId) {
      this.selectVendor(this.selectedVendor!.vendor);
    }
    this.loadVendors();
  }

  statusLabel(status: VendorVerificationStatus): string {
    switch (status) {
      case VendorVerificationStatus.Approved: return 'Approved';
      case VendorVerificationStatus.Rejected: return 'Rejected';
      case VendorVerificationStatus.Suspended: return 'Suspended';
      case VendorVerificationStatus.Blacklisted: return 'Blacklisted';
      case VendorVerificationStatus.PendingReview:
      default:
        return 'Pending Review';
    }
  }
}

