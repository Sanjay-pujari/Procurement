import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService, Invoice } from '../../services/invoice.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Invoices</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create Invoice</button>
      </div>

      <div class="invoice-list">
        <div class="invoice-card" *ngFor="let invoice of invoices">
          <div class="invoice-header">
            <div>
              <h3>Invoice #{{ invoice.id?.slice(0, 8) }}</h3>
              <span class="date">{{ invoice.submittedAt | date:'medium' }}</span>
            </div>
            <span class="status-badge" [class]="'status-' + invoice.paymentStatus">
              {{ getPaymentStatusLabel(invoice.paymentStatus) }}
            </span>
          </div>
          <div class="invoice-details">
            <div class="detail-item">
              <strong>Purchase Order:</strong>
              <span>{{ invoice.purchaseOrderId.slice(0, 8) }}</span>
            </div>
            <div class="detail-item">
              <strong>Amount:</strong>
              <span class="amount">\${{ invoice.amount.toLocaleString() }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-success" *ngIf="invoice.paymentStatus === 0" (click)="markPaid(invoice.id!)">
              Mark Paid
            </button>
            <button class="btn btn-sm btn-warning" *ngIf="invoice.paymentStatus === 0" (click)="markPartiallyPaid(invoice.id!)">
              Mark Partially Paid
            </button>
            <button class="btn btn-sm btn-secondary" (click)="editInvoice(invoice)">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="deleteInvoice(invoice.id!)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit' : 'Create' }} Invoice</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Purchase Order ID</label>
              <input type="text" [(ngModel)]="currentInvoice.purchaseOrderId" class="form-control" placeholder="PO ID" [disabled]="isEditing">
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" [(ngModel)]="currentInvoice.amount" class="form-control" placeholder="0.00" step="0.01">
            </div>
            <div class="form-group">
              <label>Payment Status</label>
              <select [(ngModel)]="currentInvoice.paymentStatus" class="form-control">
                <option [value]="0">Pending</option>
                <option [value]="1">Partially Paid</option>
                <option [value]="2">Paid</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveInvoice()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .invoice-list { display: grid; gap: 1rem; }
    .invoice-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .invoice-header h3 { margin: 0; font-size: 1.25rem; }
    .date { display: block; margin-top: 0.25rem; color: #6b7280; font-size: 0.875rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; }
    .status-0 { background: #fef3c7; color: #92400e; }
    .status-1 { background: #dbeafe; color: #1e40af; }
    .status-2 { background: #d1fae5; color: #065f46; }
    .invoice-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 6px; margin: 1rem 0; }
    .detail-item { font-size: 0.875rem; }
    .amount { color: #059669; font-weight: 600; font-size: 1.125rem; }
    .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
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
  `]
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  showModal = false;
  isEditing = false;
  currentInvoice: Invoice = this.getEmptyInvoice();

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.invoiceService.getAll().subscribe({
      next: (data) => this.invoices = data,
      error: (err) => console.error('Error loading invoices:', err)
    });
  }

  getPaymentStatusLabel(status: number): string {
    return ['Pending', 'Partially Paid', 'Paid'][status] || 'Unknown';
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentInvoice = this.getEmptyInvoice();
    this.showModal = true;
  }

  editInvoice(invoice: Invoice) {
    this.isEditing = true;
    this.currentInvoice = JSON.parse(JSON.stringify(invoice));
    this.showModal = true;
  }

  deleteInvoice(id: string) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.invoiceService.delete(id).subscribe({
        next: () => this.loadInvoices(),
        error: (err) => console.error('Error deleting invoice:', err)
      });
    }
  }

  markPaid(id: string) {
    this.invoiceService.markPaid(id).subscribe({
      next: () => this.loadInvoices(),
      error: (err) => console.error('Error marking invoice as paid:', err)
    });
  }

  markPartiallyPaid(id: string) {
    this.invoiceService.markPartiallyPaid(id).subscribe({
      next: () => this.loadInvoices(),
      error: (err) => console.error('Error marking invoice as partially paid:', err)
    });
  }

  saveInvoice() {
    const action: Observable<any> = this.isEditing
      ? this.invoiceService.update(this.currentInvoice.id!, this.currentInvoice)
      : this.invoiceService.create(this.currentInvoice);

    action.subscribe({
      next: () => {
        this.loadInvoices();
        this.closeModal();
      },
      error: (err) => console.error('Error saving invoice:', err)
    });
  }

  closeModal() {
    this.showModal = false;
  }

  getEmptyInvoice(): Invoice {
    return {
      purchaseOrderId: '',
      amount: 0,
      paymentStatus: 0
    };
  }
}

