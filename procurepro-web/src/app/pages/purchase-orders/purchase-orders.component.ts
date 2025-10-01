import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService, PurchaseOrder } from '../../services/purchase-order.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Purchase Orders</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create Purchase Order</button>
      </div>

      <div class="po-list">
        <div class="po-card" *ngFor="let po of purchaseOrders">
          <div class="po-header">
            <div>
              <h3>PO #{{ po.id?.slice(0, 8) }}</h3>
              <span class="date">{{ po.createdAt | date:'medium' }}</span>
            </div>
            <span class="status-badge" [class]="'status-' + po.status">
              {{ getStatusLabel(po.status) }}
            </span>
          </div>
          <div class="po-details">
            <div class="detail-item">
              <strong>Bid ID:</strong>
              <span>{{ po.bidId.slice(0, 8) }}</span>
            </div>
            <div class="detail-item" *ngIf="po.amendmentsJson">
              <strong>Amendments:</strong>
              <span>Yes</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-success" *ngIf="po.status === 0" (click)="acknowledgePO(po.id!)">
              Acknowledge
            </button>
            <button class="btn btn-sm btn-info" *ngIf="po.status === 1" (click)="completePO(po.id!)">
              Complete
            </button>
            <button class="btn btn-sm btn-secondary" (click)="editPO(po)">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="deletePO(po.id!)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit' : 'Create' }} Purchase Order</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Bid ID</label>
              <input type="text" [(ngModel)]="currentPO.bidId" class="form-control" placeholder="Bid ID" [disabled]="isEditing">
            </div>
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="currentPO.status" class="form-control">
                <option [value]="0">Issued</option>
                <option [value]="1">Acknowledged</option>
                <option [value]="2">Completed</option>
              </select>
            </div>
            <div class="form-group">
              <label>Amendments (JSON)</label>
              <textarea [(ngModel)]="currentPO.amendmentsJson" class="form-control" rows="4" placeholder="Optional amendments in JSON format"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="savePO()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .po-list { display: grid; gap: 1rem; }
    .po-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .po-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .po-header h3 { margin: 0; font-size: 1.25rem; }
    .date { display: block; margin-top: 0.25rem; color: #6b7280; font-size: 0.875rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; }
    .status-0 { background: #dbeafe; color: #1e40af; }
    .status-1 { background: #fef3c7; color: #92400e; }
    .status-2 { background: #d1fae5; color: #065f46; }
    .po-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 6px; margin: 1rem 0; }
    .detail-item { font-size: 0.875rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-info { background: #0ea5e9; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 600px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1.5rem; border-top: 1px solid #e5e7eb; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
    textarea.form-control { resize: vertical; font-family: monospace; }
  `]
})
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrder[] = [];
  showModal = false;
  isEditing = false;
  currentPO: PurchaseOrder = this.getEmptyPO();

  constructor(private poService: PurchaseOrderService) {}

  ngOnInit() {
    this.loadPOs();
  }

  loadPOs() {
    this.poService.getAll().subscribe({
      next: (data) => this.purchaseOrders = data,
      error: (err) => console.error('Error loading purchase orders:', err)
    });
  }

  getStatusLabel(status: number): string {
    return ['Issued', 'Acknowledged', 'Completed'][status] || 'Unknown';
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentPO = this.getEmptyPO();
    this.showModal = true;
  }

  editPO(po: PurchaseOrder) {
    this.isEditing = true;
    this.currentPO = JSON.parse(JSON.stringify(po));
    this.showModal = true;
  }

  deletePO(id: string) {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      this.poService.delete(id).subscribe({
        next: () => this.loadPOs(),
        error: (err) => console.error('Error deleting PO:', err)
      });
    }
  }

  acknowledgePO(id: string) {
    this.poService.acknowledge(id).subscribe({
      next: () => this.loadPOs(),
      error: (err) => console.error('Error acknowledging PO:', err)
    });
  }

  completePO(id: string) {
    this.poService.complete(id).subscribe({
      next: () => this.loadPOs(),
      error: (err) => console.error('Error completing PO:', err)
    });
  }

  savePO() {
    const action = this.isEditing
      ? this.poService.update(this.currentPO.id!, this.currentPO)
      : this.poService.create(this.currentPO);

    action.subscribe({
      next: () => {
        this.loadPOs();
        this.closeModal();
      },
      error: (err) => console.error('Error saving PO:', err)
    });
  }

  closeModal() {
    this.showModal = false;
  }

  getEmptyPO(): PurchaseOrder {
    return {
      bidId: '',
      status: 0,
      amendmentsJson: ''
    };
  }
}

