import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink],
    template: `
  <div class="dashboard-container">
    <h1>Dashboard Overview</h1>
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
    });
  }

  getCardValue(label: string): number {
    return this.cards.find(c => c.label === label)?.value || 0;
  }
}
