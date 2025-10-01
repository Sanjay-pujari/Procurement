import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RFQService, RFQ, RFQItem, RFQVendor } from '../../services/rfq.service';

@Component({
  selector: 'app-rfq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Request for Quotations (RFQ)</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create RFQ</button>
      </div>

      <div class="rfq-list">
        <div class="rfq-card" *ngFor="let rfq of rfqs">
          <div class="rfq-header">
            <h3>{{ rfq.title }}</h3>
            <span class="status-badge" [class]="'status-' + rfq.status">
              {{ getStatusLabel(rfq.status) }}
            </span>
          </div>
          <p class="terms">{{ rfq.terms }}</p>
          <div class="rfq-details">
            <span><strong>Due Date:</strong> {{ rfq.dueDate | date:'short' }}</span>
            <span><strong>Items:</strong> {{ rfq.items.length }}</span>
            <span><strong>Vendors:</strong> {{ rfq.rfqVendors.length }}</span>
          </div>
          <div class="actions">
            <button class="btn btn-sm" (click)="viewRFQ(rfq)">View</button>
            <button class="btn btn-sm btn-success" *ngIf="rfq.status === 0" (click)="publishRFQ(rfq.id!)">Publish</button>
            <button class="btn btn-sm btn-warning" *ngIf="rfq.status === 1" (click)="closeRFQ(rfq.id!)">Close</button>
            <button class="btn btn-sm btn-secondary" (click)="editRFQ(rfq)">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="deleteRFQ(rfq.id!)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit' : 'Create' }} RFQ</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Title</label>
              <input type="text" [(ngModel)]="currentRFQ.title" class="form-control" placeholder="RFQ Title">
            </div>
            <div class="form-group">
              <label>Terms</label>
              <textarea [(ngModel)]="currentRFQ.terms" class="form-control" rows="3" placeholder="Terms and conditions"></textarea>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="datetime-local" [(ngModel)]="currentRFQ.dueDate" class="form-control">
            </div>

            <h3>Items</h3>
            <div class="items-list">
              <div class="item-row" *ngFor="let item of currentRFQ.items; let i = index">
                <input type="text" [(ngModel)]="item.description" placeholder="Description" class="form-control">
                <input type="text" [(ngModel)]="item.specification" placeholder="Specification" class="form-control">
                <input type="number" [(ngModel)]="item.quantity" placeholder="Qty" class="form-control">
                <input type="text" [(ngModel)]="item.unit" placeholder="Unit" class="form-control">
                <button class="btn btn-sm btn-danger" (click)="removeItem(i)">×</button>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="addItem()">+ Add Item</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveRFQ()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .rfq-list { display: grid; gap: 1rem; }
    .rfq-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .rfq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .rfq-header h3 { margin: 0; font-size: 1.25rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; }
    .status-0 { background: #fef3c7; color: #92400e; }
    .status-1 { background: #dbeafe; color: #1e40af; }
    .status-2 { background: #fee2e2; color: #991b1b; }
    .status-3 { background: #d1fae5; color: #065f46; }
    .terms { color: #6b7280; margin: 0.5rem 0; }
    .rfq-details { display: flex; gap: 2rem; margin: 1rem 0; font-size: 0.875rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1.5rem; border-top: 1px solid #e5e7eb; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
    textarea.form-control { resize: vertical; }
    .items-list { margin-top: 1rem; }
    .item-row { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
    h3 { font-size: 1.125rem; margin: 1.5rem 0 1rem; }
  `]
})
export class RFQComponent implements OnInit {
  rfqs: RFQ[] = [];
  showModal = false;
  isEditing = false;
  currentRFQ: RFQ = this.getEmptyRFQ();

  constructor(private rfqService: RFQService) {}

  ngOnInit() {
    this.loadRFQs();
  }

  loadRFQs() {
    this.rfqService.getAll().subscribe({
      next: (data) => this.rfqs = data,
      error: (err) => console.error('Error loading RFQs:', err)
    });
  }

  getStatusLabel(status: number): string {
    return ['Draft', 'Published', 'Closed', 'Awarded'][status] || 'Unknown';
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentRFQ = this.getEmptyRFQ();
    this.showModal = true;
  }

  viewRFQ(rfq: RFQ) {
    alert(`RFQ Details:\n\nTitle: ${rfq.title}\nStatus: ${this.getStatusLabel(rfq.status)}\nItems: ${rfq.items.length}`);
  }

  editRFQ(rfq: RFQ) {
    this.isEditing = true;
    this.currentRFQ = JSON.parse(JSON.stringify(rfq));
    this.showModal = true;
  }

  deleteRFQ(id: string) {
    if (confirm('Are you sure you want to delete this RFQ?')) {
      this.rfqService.delete(id).subscribe({
        next: () => this.loadRFQs(),
        error: (err) => console.error('Error deleting RFQ:', err)
      });
    }
  }

  publishRFQ(id: string) {
    this.rfqService.publish(id).subscribe({
      next: () => this.loadRFQs(),
      error: (err) => console.error('Error publishing RFQ:', err)
    });
  }

  closeRFQ(id: string) {
    this.rfqService.close(id).subscribe({
      next: () => this.loadRFQs(),
      error: (err) => console.error('Error closing RFQ:', err)
    });
  }

  saveRFQ() {
    const action = this.isEditing
      ? this.rfqService.update(this.currentRFQ.id!, this.currentRFQ)
      : this.rfqService.create(this.currentRFQ);

    action.subscribe({
      next: () => {
        this.loadRFQs();
        this.closeModal();
      },
      error: (err) => console.error('Error saving RFQ:', err)
    });
  }

  addItem() {
    this.currentRFQ.items.push({ description: '', quantity: 1, specification: '', unit: '' });
  }

  removeItem(index: number) {
    this.currentRFQ.items.splice(index, 1);
  }

  closeModal() {
    this.showModal = false;
  }

  getEmptyRFQ(): RFQ {
    return {
      title: '',
      terms: '',
      dueDate: new Date().toISOString().slice(0, 16),
      status: 0,
      items: [],
      rfqVendors: []
    };
  }
}

