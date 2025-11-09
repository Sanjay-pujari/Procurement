import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface DashboardAlerts {
  pendingVendorApprovals: number;
  suspendedVendors: number;
  blacklistedVendors: number;
  pendingRequisitions: number;
  pendingPurchaseOrders: number;
  outstandingInvoices: number;
}

interface AlertCard {
  label: string;
  count: number;
  description: string;
  link?: string;
  severity: 'info' | 'warn' | 'critical';
}

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink],
    template: `
  <div class="dashboard-container">
    <h1>Dashboard Overview</h1>

    <section *ngIf="alertCards.length && (auth.hasRole('Admin') || auth.hasRole('ProcurementManager'))" class="alerts">
      <h2>Action Needed</h2>
      <div class="alert-grid">
        <a *ngFor="let alert of alertCards"
           class="alert-card"
           [class.alert-warn]="alert.severity === 'warn'"
           [class.alert-critical]="alert.severity === 'critical'"
           [routerLink]="alert.link || '.'">
          <div class="alert-count">{{ alert.count }}</div>
          <div class="alert-content">
            <h3>{{ alert.label }}</h3>
            <p>{{ alert.description }}</p>
          </div>
        </a>
      </div>
    </section>

    <div class="cards">
      <div class="card card-rfq" [routerLink]="['/rfq']">
        <div class="card-icon">📋</div>
        <div class="card-content">
          <h3>RFQs</h3>
          <div class="card-value">{{ getCardValue('RFQs') }}</div>
        </div>
      </div>
      <div class="card card-bid" [routerLink]="['/bids']">
        <div class="card-icon">💼</div>
        <div class="card-content">
          <h3>Bids</h3>
          <div class="card-value">{{ getCardValue('Bids') }}</div>
        </div>
      </div>
      <div class="card card-po" [routerLink]="['/purchase-orders']">
        <div class="card-icon">📄</div>
        <div class="card-content">
          <h3>Purchase Orders</h3>
          <div class="card-value">{{ getCardValue('POs') }}</div>
        </div>
      </div>
      <div class="card card-invoice" [routerLink]="['/invoices']">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <h3>Invoices</h3>
          <div class="card-value">{{ getCardValue('Invoices') }}</div>
        </div>
      </div>
      <div class="card card-rfp">
        <div class="card-icon">📝</div>
        <div class="card-content">
          <h3>RFPs</h3>
          <div class="card-value">{{ getCardValue('RFPs') }}</div>
        </div>
      </div>
      <div class="card card-rfi">
        <div class="card-icon">❓</div>
        <div class="card-content">
          <h3>RFIs</h3>
          <div class="card-value">{{ getCardValue('RFIs') }}</div>
        </div>
      </div>
    </div>

    <div class="quick-actions" *ngIf="auth.hasRole('Admin') || auth.hasRole('ProcurementManager')">
      <h2>Quick Actions</h2>
      <div class="action-buttons">
        <button class="action-btn" [routerLink]="['/rfq']">Create New RFQ</button>
        <button class="action-btn" [routerLink]="['/vendors']">Manage Vendors</button>
        <button class="action-btn" [routerLink]="['/users']" *ngIf="auth.hasRole('Admin')">Manage Users</button>
      </div>
    </div>
  </div>
  `,
    styles: [`
      .dashboard-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
      h1 { margin: 0 0 2rem; font-size: 2rem; color: #111827; }
      .alerts { margin-bottom: 2.5rem; background: white; border-radius: 14px; padding: 1.75rem; box-shadow: 0 18px 35px rgba(15,23,42,0.08); }
      .alerts h2 { margin: 0 0 1.5rem; font-size: 1.25rem; color: #111827; }
      .alert-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
      .alert-card { display: flex; gap: 1rem; align-items: center; padding: 1.25rem; border-radius: 12px; border: 1px solid #dbeafe; background: #eff6ff; color: #1e3a8a; text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .alert-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18); }
      .alert-count { font-size: 2rem; font-weight: 700; min-width: 2.5rem; text-align: center; }
      .alert-content h3 { margin: 0; font-size: 1rem; font-weight: 600; }
      .alert-content p { margin: 0.25rem 0 0; font-size: 0.9rem; color: inherit; }
      .alert-warn { border-color: #fbbf24; background: #fef3c7; color: #92400e; }
      .alert-critical { border-color: #fca5a5; background: #fee2e2; color: #991b1b; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
      .card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s; display: flex; gap: 1rem; align-items: center; }
      .card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .card-icon { font-size: 2.5rem; }
      .card-content { flex: 1; }
      .card-content h3 { margin: 0 0 0.5rem; font-size: 0.875rem; color: #6b7280; font-weight: 500; text-transform: uppercase; }
      .card-value { font-size: 2rem; font-weight: 700; color: #111827; }
      .card-rfq { border-left: 4px solid #3b82f6; }
      .card-bid { border-left: 4px solid #8b5cf6; }
      .card-po { border-left: 4px solid #10b981; }
      .card-invoice { border-left: 4px solid #f59e0b; }
      .card-rfp { border-left: 4px solid #06b6d4; }
      .card-rfi { border-left: 4px solid #ec4899; }
      .quick-actions { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .quick-actions h2 { margin: 0 0 1.5rem; font-size: 1.25rem; color: #111827; }
      .action-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
      .action-btn { padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
      .action-btn:hover { background: #2563eb; transform: scale(1.02); }
    `]
})
export class DashboardComponent {
  private http = inject(HttpClient);
  cards: { label: string, value: number }[] = [];
  alertCards: AlertCard[] = [];

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.http.get<any>(`${environment.apiBase}/dashboard/summary`).subscribe(s => {
      this.cards = [
        { label: 'Bids', value: s.bids },
        { label: 'RFQs', value: s.rfqs },
        { label: 'RFPs', value: s.rfps },
        { label: 'RFIs', value: s.rfis },
        { label: 'POs', value: s.pos },
        { label: 'Invoices', value: s.invoices },
      ];
      this.prepareAlerts(s.alerts as DashboardAlerts | undefined);
    });
  }

  private prepareAlerts(alerts?: DashboardAlerts) {
    if (!alerts) {
      this.alertCards = [];
      return;
    }

    const cards: AlertCard[] = [];

    if (alerts.pendingVendorApprovals > 0) {
      cards.push({
        label: 'Vendors awaiting approval',
        count: alerts.pendingVendorApprovals,
        description: 'Review KYC submissions to activate new vendors.',
        link: '/vendors',
        severity: alerts.pendingVendorApprovals > 3 ? 'critical' : 'warn'
      });
    }

    if (alerts.suspendedVendors > 0) {
      cards.push({
        label: 'Vendors suspended',
        count: alerts.suspendedVendors,
        description: 'Assess suspended vendors and determine follow-up actions.',
        link: '/vendors',
        severity: 'warn'
      });
    }

    if (alerts.blacklistedVendors > 0) {
      cards.push({
        label: 'Blacklisted vendors',
        count: alerts.blacklistedVendors,
        description: 'Review blacklist justifications and compliance documentation.',
        link: '/vendors',
        severity: 'critical'
      });
    }

    if (alerts.pendingRequisitions > 0) {
      cards.push({
        label: 'PRs awaiting approval',
        count: alerts.pendingRequisitions,
        description: 'Keep procurement moving by approving requisitions.',
        link: '/purchase-requisitions',
        severity: alerts.pendingRequisitions > 2 ? 'warn' : 'info'
      });
    }

    if (alerts.pendingPurchaseOrders > 0) {
      cards.push({
        label: 'POs awaiting acknowledgement',
        count: alerts.pendingPurchaseOrders,
        description: 'Follow up with vendors on newly issued purchase orders.',
        link: '/purchase-orders',
        severity: alerts.pendingPurchaseOrders > 1 ? 'warn' : 'info'
      });
    }

    if (alerts.outstandingInvoices > 0) {
      cards.push({
        label: 'Outstanding invoices',
        count: alerts.outstandingInvoices,
        description: 'Review pending payments and reconcile with finance.',
        link: '/invoices',
        severity: alerts.outstandingInvoices > 5 ? 'critical' : 'warn'
      });
    }

    this.alertCards = cards;
  }

  getCardValue(label: string): number {
    return this.cards.find(c => c.label === label)?.value || 0;
  }
}
