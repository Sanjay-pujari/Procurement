import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BidService, Bid, BidItem } from '../../services/bid.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-bids',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Bids Management</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Submit Bid</button>
      </div>

      <div class="bids-list">
        <div class="bid-card" *ngFor="let bid of bids">
          <div class="bid-header">
            <div>
              <h3>Bid #{{ bid.id?.slice(0, 8) }}</h3>
              <span class="score">Score: {{ bid.score.toFixed(2) }}</span>
            </div>
            <span class="visibility-badge" [class]="'visibility-' + bid.visibility">
              {{ bid.visibility === 0 ? 'Open' : 'Closed' }}
            </span>
          </div>
          <div class="bid-details">
            <div class="detail-item">
              <strong>Total Amount:</strong>
              <span class="amount">\${{ bid.totalAmount.toLocaleString() }}</span>
            </div>
            <div class="detail-item">
              <strong>Items:</strong> {{ bid.items.length }}
            </div>
            <div class="detail-item">
              <strong>Submitted:</strong> {{ bid.submittedAt | date:'short' }}
            </div>
          </div>
          <div class="items-summary">
            <h4>Items:</h4>
            <div class="item" *ngFor="let item of bid.items">
              {{ item.description }} - {{ item.quantity }} @ \${{ item.unitPrice }}
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-info" (click)="evaluateBid(bid.id!)">Re-evaluate</button>
            <button class="btn btn-sm btn-secondary" (click)="editBid(bid)">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="deleteBid(bid.id!)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit' : 'Submit' }} Bid</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>RFQ ID</label>
              <input type="text" [(ngModel)]="currentBid.rfqId" class="form-control" placeholder="RFQ ID">
            </div>
            <div class="form-group">
              <label>Vendor ID</label>
              <input type="text" [(ngModel)]="currentBid.vendorId" class="form-control" placeholder="Vendor ID">
            </div>
            <div class="form-group">
              <label>Visibility</label>
              <select [(ngModel)]="currentBid.visibility" class="form-control">
                <option [value]="0">Open</option>
                <option [value]="1">Closed</option>
              </select>
            </div>

            <h3>Bid Items</h3>
            <div class="items-list">
              <div class="item-row" *ngFor="let item of currentBid.items; let i = index">
                <input type="text" [(ngModel)]="item.description" placeholder="Description" class="form-control">
                <input type="number" [(ngModel)]="item.quantity" placeholder="Quantity" class="form-control">
                <input type="number" [(ngModel)]="item.unitPrice" placeholder="Unit Price" class="form-control" step="0.01">
                <button class="btn btn-sm btn-danger" (click)="removeItem(i)">×</button>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="addItem()">+ Add Item</button>
            </div>
            <div class="total-amount">
              <strong>Total Amount:</strong> \${{ calculateTotal().toLocaleString() }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveBid()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .bids-list { display: grid; gap: 1rem; }
    .bid-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .bid-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .bid-header h3 { margin: 0; font-size: 1.25rem; }
    .score { display: inline-block; margin-top: 0.25rem; padding: 0.25rem 0.5rem; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 0.875rem; font-weight: 600; }
    .visibility-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; }
    .visibility-0 { background: #d1fae5; color: #065f46; }
    .visibility-1 { background: #fee2e2; color: #991b1b; }
    .bid-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0; padding: 1rem; background: #f9fafb; border-radius: 6px; }
    .detail-item { font-size: 0.875rem; }
    .amount { color: #059669; font-weight: 600; font-size: 1.125rem; }
    .items-summary { margin: 1rem 0; }
    .items-summary h4 { font-size: 1rem; margin-bottom: 0.5rem; }
    .item { padding: 0.5rem; background: #f3f4f6; border-radius: 4px; margin-bottom: 0.25rem; font-size: 0.875rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-info { background: #0ea5e9; color: white; }
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
    .items-list { margin-top: 1rem; }
    .item-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
    .total-amount { margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-radius: 6px; text-align: right; font-size: 1.125rem; }
    h3 { font-size: 1.125rem; margin: 1.5rem 0 1rem; }
  `]
})
export class BidsComponent implements OnInit {
  bids: Bid[] = [];
  showModal = false;
  isEditing = false;
  currentBid: Bid = this.getEmptyBid();

  constructor(private bidService: BidService) {}

  ngOnInit() {
    this.loadBids();
  }

  loadBids() {
    this.bidService.getAll().subscribe({
      next: (data) => this.bids = data,
      error: (err) => console.error('Error loading bids:', err)
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentBid = this.getEmptyBid();
    this.showModal = true;
  }

  editBid(bid: Bid) {
    this.isEditing = true;
    this.currentBid = JSON.parse(JSON.stringify(bid));
    this.showModal = true;
  }

  deleteBid(id: string) {
    if (confirm('Are you sure you want to delete this bid?')) {
      this.bidService.delete(id).subscribe({
        next: () => this.loadBids(),
        error: (err) => console.error('Error deleting bid:', err)
      });
    }
  }

  evaluateBid(id: string) {
    this.bidService.evaluate(id).subscribe({
      next: (score) => {
        alert(`Bid re-evaluated. New score: ${score.toFixed(2)}`);
        this.loadBids();
      },
      error: (err) => console.error('Error evaluating bid:', err)
    });
  }

  saveBid() {
    this.currentBid.totalAmount = this.calculateTotal();
    this.currentBid.score = 0;

    const action: Observable<any> = this.isEditing
      ? this.bidService.update(this.currentBid.id!, this.currentBid)
      : this.bidService.create(this.currentBid);

    action.subscribe({
      next: () => {
        this.loadBids();
        this.closeModal();
      },
      error: (err) => console.error('Error saving bid:', err)
    });
  }

  addItem() {
    this.currentBid.items.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  removeItem(index: number) {
    this.currentBid.items.splice(index, 1);
  }

  calculateTotal(): number {
    return this.currentBid.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  closeModal() {
    this.showModal = false;
  }

  getEmptyBid(): Bid {
    return {
      rfqId: '',
      vendorId: '',
      visibility: 1,
      totalAmount: 0,
      score: 0,
      items: []
    };
  }
}

