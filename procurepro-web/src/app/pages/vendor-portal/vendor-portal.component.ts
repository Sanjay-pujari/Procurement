import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VendorPortalService,
  VendorRfqSummary,
  VendorRfqDetail,
  SubmitQuotationRequest,
  SubmitQuotationItem
} from '../../services/vendor-portal.service';
import { RfqVendorStatus } from '../../services/rfq.service';

interface QuoteItemDraft {
  rfqItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface AttachmentDraft {
  fileName: string;
  storageUrl: string;
}

@Component({
  selector: 'app-vendor-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="layout">
    <section class="panel list">
      <div class="panel-header">
        <h2>My RFQ Invitations</h2>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Due</th>
              <th>Status</th>
              <th>Quote</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rfq of rfqs" (click)="selectRfq(rfq)" [class.selected]="rfq.rfqId === selectedRfqId">
              <td>{{ rfq.referenceNumber }}</td>
              <td>{{ rfq.title }}</td>
              <td>{{ rfq.dueDate | date:'mediumDate' }}</td>
              <td><span class="chip" [class.submitted]="rfq.status === RfqVendorStatus.QuoteSubmitted" [class.invited]="rfq.status === RfqVendorStatus.InvitationSent">{{ statusLabel(rfq.status) }}</span></td>
              <td>
                <span class="chip small" [class.complete]="rfq.quoteSubmitted">{{ rfq.quoteSubmitted ? 'Submitted' : 'Pending' }}</span>
              </td>
            </tr>
            <tr *ngIf="rfqs.length === 0">
              <td colspan="5" class="empty">No RFQs assigned yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel detail">
      <ng-container *ngIf="selected; else placeholder">
        <div class="card">
          <h3>{{ selected.title }}</h3>
          <p class="meta">
            <span>Reference: {{ selected.referenceNumber }}</span>
            <span>Due: {{ selected.dueDate | date:'medium' }}</span>
          </p>
          <p>{{ selected.terms || 'No terms provided.' }}</p>
        </div>

        <div class="card">
          <h4>Line Items</h4>
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
          <h4>Supporting Attachments</h4>
          <p *ngIf="selected.attachments.length === 0" class="empty">No attachments.</p>
          <ul *ngIf="selected.attachments.length">
            <li *ngFor="let att of selected.attachments">
              <a [href]="att.storageUrl" target="_blank">{{ att.fileName }}</a>
            </li>
          </ul>
        </div>

        <div class="card">
          <h4>Submit Quotation</h4>
          <form (ngSubmit)="submitQuote()">
            <div class="grid two">
              <label>
                Currency
                <input type="text" [(ngModel)]="quote.currency" name="currency" required />
              </label>
              <label>
                Expected Delivery
                <input type="date" [(ngModel)]="quote.expectedDeliveryDate" name="expectedDeliveryDate" />
              </label>
              <label class="full">
                Delivery Terms
                <input type="text" [(ngModel)]="quote.deliveryTerms" name="deliveryTerms" />
              </label>
              <label>
                Tax Amount
                <input type="number" [(ngModel)]="quote.taxAmount" name="taxAmount" min="0" step="0.01" />
              </label>
              <label class="full">
                Remarks
                <textarea rows="2" [(ngModel)]="quote.remarks" name="remarks"></textarea>
              </label>
            </div>

            <div class="section">
              <h5>Pricing</h5>
              <table class="mini-table">
                <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Notes</th></tr>
                <tr *ngFor="let item of quote.items">
                  <td>{{ item.description }}</td>
                  <td><input type="number" [(ngModel)]="item.quantity" name="qty-{{ item.rfqItemId }}" min="0" step="0.001" /></td>
                  <td><input type="number" [(ngModel)]="item.unitPrice" name="price-{{ item.rfqItemId }}" min="0" step="0.01" /></td>
                  <td><input type="text" [(ngModel)]="item.notes" name="notes-{{ item.rfqItemId }}" /></td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h5>Attachments</h5>
              <div class="attachment-row" *ngFor="let att of quote.attachments; let i=index">
                <input type="text" [(ngModel)]="att.fileName" name="att-name-{{i}}" placeholder="File name" />
                <input type="text" [(ngModel)]="att.storageUrl" name="att-url-{{i}}" placeholder="Storage URL" />
                <button class="btn danger" type="button" (click)="removeAttachment(i)">Remove</button>
              </div>
              <button class="btn neutral" type="button" (click)="addAttachment()">+ Add Attachment</button>
            </div>

            <div class="actions">
              <button class="btn primary" type="submit" [disabled]="submitting">Submit Quote</button>
              <span class="info" *ngIf="selected?.existingQuotation">Last submitted on {{ selected.existingQuotation?.expectedDeliveryDate | date:'medium' }}</span>
            </div>
          </form>
        </div>
      </ng-container>

      <ng-template #placeholder>
        <div class="empty-card">
          <p>Select an RFQ to review details and submit your quotation.</p>
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
    table { width:100%; border-collapse:collapse; }
    th, td { padding:0.75rem; border-bottom:1px solid #e5e7eb; text-align:left; }
    tbody tr { cursor:pointer; transition:background 0.2s; }
    tbody tr:hover { background:#f8fafc; }
    tbody tr.selected { background:#e0f2fe; }
    .chip { display:inline-block; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.75rem; text-transform:capitalize; background:#e5e7eb; color:#374151; }
    .chip.submitted { background:#dcfce7; color:#166534; }
    .chip.invited { background:#dbeafe; color:#1e40af; }
    .chip.small { padding:0.25rem 0.5rem; font-size:0.7rem; }
    .chip.small.complete { background:#bbf7d0; color:#0f5132; }
    .empty { text-align:center; padding:1rem; color:#9ca3af; }
    .card { background:#f9fafb; border-radius:12px; padding:1.25rem; box-shadow: inset 0 0 0 1px #e5e7eb; margin-bottom:1rem; }
    .card h3 { margin-top:0; }
    .meta { display:flex; flex-wrap:wrap; gap:1rem; font-size:0.85rem; color:#6b7280; margin:0.5rem 0; }
    .actions { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; margin-top:1rem; }
    .btn { border:none; border-radius:8px; padding:0.6rem 1.2rem; font-weight:600; cursor:pointer; transition:transform 0.1s; }
    .btn.primary { background:#2563eb; color:white; }
    .btn.neutral { background:#64748b; color:white; }
    .btn.danger { background:#dc2626; color:white; }
    .btn:disabled { opacity:0.6; cursor:not-allowed; }
    .mini-table th, .mini-table td { border-bottom:1px solid #dbeafe; padding:0.5rem; font-size:0.9rem; }
    .grid.two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
    .grid.two label { display:flex; flex-direction:column; gap:0.35rem; font-weight:600; color:#374151; }
    .grid.two .full { grid-column:span 2; }
    input, textarea { border:1px solid #d1d5db; border-radius:8px; padding:0.6rem; font-size:1rem; }
    textarea { resize:vertical; }
    .section { margin-top:1.5rem; }
    .attachment-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)) auto; gap:0.5rem; margin-bottom:0.5rem; }
    .empty-card { background:#f9fafb; border-radius:12px; padding:2rem; text-align:center; color:#6b7280; box-shadow: inset 0 0 0 1px #e5e7eb; }
    .info { color:#0f766e; font-size:0.85rem; }
    @media(max-width:1100px){ .layout { grid-template-columns:1fr; } .panel { max-height:none; } }
  `]
})
export class VendorPortalComponent implements OnInit {
  RfqVendorStatus = RfqVendorStatus;

  rfqs: VendorRfqSummary[] = [];
  selected?: VendorRfqDetail;
  selectedRfqId: string | null = null;

  quote: {
    currency: string;
    expectedDeliveryDate?: string;
    deliveryTerms?: string;
    taxAmount: number;
    remarks?: string;
    items: QuoteItemDraft[];
    attachments: AttachmentDraft[];
  } = this.emptyQuote();

  submitting = false;

  constructor(private vendorPortal: VendorPortalService) {}

  ngOnInit(): void {
    this.loadRfqs();
  }

  loadRfqs(): void {
    this.vendorPortal.listAssignedRfqs().subscribe({
      next: data => this.rfqs = data,
      error: err => console.error('Failed to load RFQs', err)
    });
  }

  selectRfq(rfq: VendorRfqSummary): void {
    this.selectedRfqId = rfq.rfqId;
    this.vendorPortal.getRfqDetail(rfq.rfqId).subscribe({
      next: detail => {
        this.selected = detail;
        this.prepQuote(detail);
      },
      error: err => console.error('Failed to load RFQ detail', err)
    });
  }

  prepQuote(detail: VendorRfqDetail): void {
    if (detail.existingQuotation) {
      const quote = detail.existingQuotation;
      this.quote = {
        currency: quote.currency,
        expectedDeliveryDate: quote.expectedDeliveryDate?.split('T')[0],
        deliveryTerms: quote.deliveryTerms ?? '',
        taxAmount: quote.taxAmount,
        remarks: quote.remarks ?? '',
        items: quote.items.map(i => ({
          rfqItemId: i.rfqItemId,
          description: detail.items.find(di => di.itemId === i.rfqItemId)?.description ?? '',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes
        })),
        attachments: quote.attachments.map(a => ({ fileName: a.fileName, storageUrl: a.storageUrl }))
      };
    } else {
      this.quote = {
        currency: 'USD',
        expectedDeliveryDate: undefined,
        deliveryTerms: '',
        taxAmount: 0,
        remarks: '',
        items: detail.items.map(item => ({
          rfqItemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: 0,
          notes: ''
        })),
        attachments: []
      };
    }
  }

  submitQuote(): void {
    if (!this.selectedRfqId || !this.selected) return;
    if (this.quote.items.some(item => item.unitPrice < 0 || item.quantity < 0)) {
      alert('Quantities and unit prices must be positive.');
      return;
    }

    const payload: SubmitQuotationRequest = {
      currency: this.quote.currency || 'USD',
      expectedDeliveryDate: this.quote.expectedDeliveryDate,
      deliveryTerms: this.quote.deliveryTerms,
      taxAmount: Number(this.quote.taxAmount) || 0,
      remarks: this.quote.remarks,
      items: this.quote.items.map(item => ({
        rfqItemId: item.rfqItemId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        notes: item.notes
      })),
      attachments: this.quote.attachments.map(att => ({ fileName: att.fileName, storageUrl: att.storageUrl }))
    };

    this.submitting = true;
    this.vendorPortal.submitQuote(this.selectedRfqId, payload).subscribe({
      next: quotation => {
        this.submitting = false;
        this.selected = { ...this.selected!, existingQuotation: quotation };
        this.prepQuote(this.selected);
        this.loadRfqs();
        alert('Quotation submitted successfully.');
      },
      error: err => {
        this.submitting = false;
        console.error('Failed to submit quote', err);
        alert('Unable to submit quote. Please verify your inputs.');
      }
    });
  }

  addAttachment(): void {
    this.quote.attachments.push({ fileName: '', storageUrl: '' });
  }

  removeAttachment(index: number): void {
    this.quote.attachments.splice(index, 1);
  }

  statusLabel(status: RfqVendorStatus): string {
    switch (status) {
      case RfqVendorStatus.Pending: return 'Pending';
      case RfqVendorStatus.InvitationSent: return 'Invited';
      case RfqVendorStatus.Acknowledged: return 'Acknowledged';
      case RfqVendorStatus.QuoteSubmitted: return 'Quote Submitted';
      case RfqVendorStatus.Declined: return 'Declined';
      default: return 'Unknown';
    }
  }

  emptyQuote() {
    return {
      currency: 'USD',
      expectedDeliveryDate: undefined,
      deliveryTerms: '',
      taxAmount: 0,
      remarks: '',
      items: [] as QuoteItemDraft[],
      attachments: [] as AttachmentDraft[]
    };
  }
}


