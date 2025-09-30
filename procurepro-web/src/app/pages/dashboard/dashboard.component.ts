import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule],
    template: `
  <h2>Dashboard</h2>
  <div class="cards">
    <div class="card" *ngFor="let c of cards">{{c.label}}: <b>{{c.value}}</b></div>
  </div>
  `,
    styles: [`.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.card{padding:12px;border:1px solid #ddd;border-radius:8px}`]
})
export class DashboardComponent {
  private http = inject(HttpClient);
  cards: { label: string, value: number }[] = [];

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
}
