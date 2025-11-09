import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface MonthlySpend {
  year: number;
  month: number;
  totalAmount: number;
}

export interface ReportsOverview {
  purchaseRequisitions: StatusBreakdown[];
  rfqs: StatusBreakdown[];
  purchaseOrders: StatusBreakdown[];
  invoices: StatusBreakdown[];
  vendors: StatusBreakdown[];
  totalIssuedSpendYtd: number;
  outstandingInvoiceAmount: number;
  monthlyPurchaseOrderTotals: MonthlySpend[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBase}/reports`;

  getOverview(): Observable<ReportsOverview> {
    return this.http.get<ReportsOverview>(`${this.baseUrl}/overview`);
  }
}

