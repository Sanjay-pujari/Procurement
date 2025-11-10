import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorService, SubmitKycRequest } from '../../services/vendor.service';

interface DocumentDraft {
  documentType: string;
  fileName: string;
  storageUrl: string;
  notes?: string;
}

@Component({
    selector: 'app-vendor-kyc',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
  <section class="kyc-shell">
    <header class="page-header">
      <div>
        <h1>Vendor KYC Profile</h1>
        <p>Keep your company details and compliance documents up to date so procurement can approve you quickly.</p>
      </div>
    </header>

    <form class="kyc-form" (ngSubmit)="submit()">
      <fieldset>
        <legend>Company Details</legend>
        <div class="grid">
          <label>
            Phone
            <input type="text" [(ngModel)]="form.phone" name="phone" placeholder="+1 555 123 4567">
          </label>
          <label>
            Website
            <input type="url" [(ngModel)]="form.website" name="website" placeholder="https://example.com">
          </label>
          <label class="full">
            Address
            <textarea rows="2" [(ngModel)]="form.address" name="address" placeholder="Street, City, Country"></textarea>
          </label>
          <label>
            Tax / Registration ID
            <input type="text" [(ngModel)]="form.taxId" name="taxId" placeholder="e.g. VAT123456">
          </label>
          <label class="full">
            Notes to Procurement
            <textarea rows="2" [(ngModel)]="form.notes" name="notes" placeholder="Provide any additional context or clarification..."></textarea>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Compliance Documents</legend>
        <div class="documents">
          <div class="doc-row" *ngFor="let doc of documents; let i = index">
            <label>
              Type
              <input type="text" [(ngModel)]="doc.documentType" name="type-{{i}}" placeholder="e.g. Company Registration" required>
            </label>
            <label>
              File Name
              <input type="text" [(ngModel)]="doc.fileName" name="name-{{i}}" placeholder="registration.pdf" required>
            </label>
            <label>
              Storage URL
              <input type="url" [(ngModel)]="doc.storageUrl" name="url-{{i}}" placeholder="https://storage.example/registration.pdf" required>
            </label>
            <label>
              Notes
              <input type="text" [(ngModel)]="doc.notes" name="note-{{i}}" placeholder="Optional notes">
            </label>
            <button type="button" class="btn danger" (click)="removeDocument(i)">Remove</button>
          </div>
          <button type="button" class="btn secondary" (click)="addDocument()">+ Add Document</button>
        </div>
      </fieldset>

      <div class="form-actions">
        <button type="submit" class="btn primary" [disabled]="submitting || !documents.length">Submit for Review</button>
        <span class="hint">Your status will change to "Pending Review" until procurement verifies the submission.</span>
      </div>

      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </form>
  </section>
  `,
    styles: [`
    :host { display:block; padding:2rem; }
    .kyc-shell { max-width: 960px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem; }
    .page-header h1 { margin:0; font-size:2rem; }
    .page-header p { margin:0.5rem 0 0; color:#6b7280; max-width:560px; }
    .kyc-form { background:white; border-radius:16px; box-shadow:0 20px 40px rgba(15,23,42,0.08); padding:2rem; display:flex; flex-direction:column; gap:2rem; }
    fieldset { border:none; padding:0; display:flex; flex-direction:column; gap:1rem; }
    legend { font-size:1.25rem; font-weight:600; color:#111827; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1rem; }
    .grid label { display:flex; flex-direction:column; gap:0.5rem; font-weight:600; color:#374151; }
    .grid label.full { grid-column:1 / -1; }
    input, textarea { border:1px solid #d1d5db; border-radius:10px; padding:0.75rem; font-size:1rem; transition:border-color 0.2s, box-shadow 0.2s; }
    input:focus, textarea:focus { border-color:#2563eb; outline:none; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
    .documents { display:flex; flex-direction:column; gap:1rem; }
    .doc-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; align-items:end; }
    .btn { border:none; border-radius:10px; padding:0.65rem 1.4rem; font-weight:600; cursor:pointer; transition:transform 0.1s ease; }
    .btn.primary { background:#2563eb; color:white; }
    .btn.secondary { background:#64748b; color:white; align-self:flex-start; }
    .btn.danger { background:#dc2626; color:white; }
    .btn:disabled { opacity:0.6; cursor:not-allowed; }
    .btn:hover:not(:disabled) { transform:translateY(-1px); }
    .form-actions { display:flex; flex-direction:column; gap:0.75rem; }
    .hint { color:#6b7280; font-size:0.9rem; }
    .success { color:#15803d; font-weight:600; }
    .error { color:#dc2626; font-weight:600; }
    @media (max-width: 720px) {
      .kyc-form { padding:1.5rem; }
    }
  `]
})
export class VendorKycComponent {
  form: SubmitKycRequest = {
    phone: '',
    address: '',
    taxId: '',
    website: '',
    notes: '',
    documents: []
  };
  documents: DocumentDraft[] = [{
    documentType: '',
    fileName: '',
    storageUrl: '',
    notes: ''
  }];
  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private vendorService: VendorService) {}

  addDocument(): void {
    this.documents.push({ documentType: '', fileName: '', storageUrl: '', notes: '' });
  }

  removeDocument(index: number): void {
    this.documents.splice(index, 1);
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.documents.length || this.documents.some(d => !d.documentType || !d.fileName || !d.storageUrl)) {
      this.errorMessage = 'Please provide at least one document with type, file name, and storage URL.';
      return;
    }

    this.submitting = true;

    const payload: SubmitKycRequest = {
      phone: this.form.phone?.trim() || undefined,
      address: this.form.address?.trim() || undefined,
      taxId: this.form.taxId?.trim() || undefined,
      website: this.form.website?.trim() || undefined,
      notes: this.form.notes?.trim() || undefined,
      documents: this.documents.map(d => ({
        documentType: d.documentType.trim(),
        fileName: d.fileName.trim(),
        storageUrl: d.storageUrl.trim(),
        notes: d.notes?.trim() || undefined
      }))
    };

    this.vendorService.submitKyc(payload).subscribe({
      next: () => {
        this.successMessage = 'Thanks! Your KYC submission has been sent for review.';
        this.submitting = false;
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Unable to submit KYC details. Please try again.';
        this.submitting = false;
      }
    });
  }
}

