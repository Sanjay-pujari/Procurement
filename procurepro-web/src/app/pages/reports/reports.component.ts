import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService, ReportsOverview, StatusBreakdown, MonthlySpend } from '../../services/reports.service';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule],
    template: `
  <div class="reports-container" *ngIf="overview; else loadingOrError">
    <div class="hero">
      <div>
        <h1>Procurement Insights</h1>
        <p>Track requisitions, sourcing events, and fulfilment health at a glance.</p>
      </div>
      <div class="summary-cards">
        <div class="summary-card primary">
          <h3>YTD Issued Spend</h3>
          <span>{{ overview.totalIssuedSpendYtd | currency:'USD':'symbol':'1.0-0' }}</span>
        </div>
        <div class="summary-card warn">
          <h3>Outstanding Invoices</h3>
          <span>{{ overview.outstandingInvoiceAmount | currency:'USD':'symbol':'1.0-0' }}</span>
        </div>
      </div>
    </div>

    <section class="grid">
      <div class="card">
        <h2>Purchase Requisition Pipeline</h2>
        <ul>
          <li *ngFor="let item of overview.purchaseRequisitions">
            <span>{{ toSentenceCase(item.status) }}</span>
            <strong>{{ item.count }}</strong>
          </li>
          <li *ngIf="!overview.purchaseRequisitions.length" class="muted">No requisitions recorded.</li>
        </ul>
      </div>

      <div class="card">
        <h2>RFQ Lifecycle</h2>
        <ul>
          <li *ngFor="let item of overview.rfqs">
            <span>{{ toSentenceCase(item.status) }}</span>
            <strong>{{ item.count }}</strong>
          </li>
          <li *ngIf="!overview.rfqs.length" class="muted">No RFQs recorded.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Purchase Orders</h2>
        <ul>
          <li *ngFor="let item of overview.purchaseOrders">
            <span>{{ toSentenceCase(item.status) }}</span>
            <strong>{{ item.count }}</strong>
          </li>
          <li *ngIf="!overview.purchaseOrders.length" class="muted">No purchase orders recorded.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Invoice Collection</h2>
        <ul>
          <li *ngFor="let item of overview.invoices">
            <span>{{ toSentenceCase(item.status) }}</span>
            <strong>{{ item.count }}</strong>
          </li>
          <li *ngIf="!overview.invoices.length" class="muted">No invoices recorded.</li>
        </ul>
      </div>

      <div class="card wide">
        <h2>Monthly PO Spend (Last 12 Months)</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="align-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of overview.monthlyPurchaseOrderTotals">
              <td>{{ formatMonth(item) }}</td>
              <td class="align-right">{{ item.totalAmount | currency:'USD':'symbol':'1.0-0' }}</td>
            </tr>
            <tr *ngIf="!overview.monthlyPurchaseOrderTotals.length">
              <td colspan="2" class="muted">No purchase orders issued in the past 12 months.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Vendor Health</h2>
        <ul>
          <li *ngFor="let item of overview.vendors">
            <span>{{ toSentenceCase(item.status) }}</span>
            <strong>{{ item.count }}</strong>
          </li>
          <li *ngIf="!overview.vendors.length" class="muted">No vendors onboarded.</li>
        </ul>
      </div>
    </section>
  </div>

  <ng-template #loadingOrError>
    <div class="placeholder" *ngIf="error; else loading">
      <h2>Unable to load reports</h2>
      <p>{{ error }}</p>
      <button (click)="reload()">Retry</button>
    </div>
    <ng-template #loading>
      <div class="placeholder loading">
        <div class="spinner"></div>
        <p>Loading procurement insights…</p>
      </div>
    </ng-template>
  </ng-template>
  `,
    styles: [`
    :host { display: block; padding: 2rem; }
    .reports-container { display: flex; flex-direction: column; gap: 2rem; }
    .hero { display: flex; justify-content: space-between; align-items: center; gap: 2rem; }
    .hero h1 { margin: 0; font-size: 2rem; }
    .hero p { margin: 0.5rem 0 0; color: #6b7280; max-width: 360px; }
    .summary-cards { display: flex; gap: 1rem; }
    .summary-card { padding: 1.5rem; border-radius: 16px; min-width: 220px; color: white; display: flex; flex-direction: column; gap: 0.25rem; box-shadow: 0 18px 35px rgba(15,23,42,0.15); }
    .summary-card h3 { margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .summary-card span { font-size: 1.75rem; font-weight: 700; }
    .summary-card.primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
    .summary-card.warn { background: linear-gradient(135deg, #f97316, #ea580c); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: white; padding: 1.5rem; border-radius: 14px; box-shadow: 0 20px 40px rgba(15,23,42,0.08); display: flex; flex-direction: column; gap: 1rem; }
    .card.wide { grid-column: span 2; }
    .card h2 { margin: 0; font-size: 1.25rem; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    li { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
    li span { color: #4b5563; font-weight: 500; }
    li strong { font-size: 1.25rem; color: #111827; }
    .muted { color: #9ca3af; font-weight: 500; text-align: center; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb; }
    th { text-align: left; font-size: 0.85rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
    .align-right { text-align: right; }
    .placeholder { background: white; border-radius: 16px; padding: 3rem; text-align: center; box-shadow: 0 20px 40px rgba(15,23,42,0.08); }
    .placeholder.loading { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
    .spinner { width: 48px; height: 48px; border-radius: 999px; border: 4px solid #dbeafe; border-top-color: #2563eb; animation: spin 0.8s linear infinite; }
    button { border: none; background: #2563eb; color: white; border-radius: 8px; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 960px) {
      .hero { flex-direction: column; align-items: flex-start; }
      .summary-cards { width: 100%; flex-direction: column; }
      .card.wide { grid-column: span 1; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  private reports = inject(ReportsService);

  overview: ReportsOverview | null = null;
  error: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.load();
  }

  toSentenceCase(value: string): string {
    if (!value) {
      return '';
    }
    const formatted = value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  formatMonth(item: MonthlySpend): string {
    const date = new Date(item.year, item.month - 1, 1);
    return date.toLocaleString(undefined, { month: 'short', year: 'numeric' });
  }

  private load(): void {
    this.error = null;
    this.overview = null;
    this.reports.getOverview().subscribe({
      next: data => this.overview = data,
      error: err => this.error = err?.error?.message ?? 'An unexpected error occurred.'
    });
  }
}

