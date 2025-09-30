import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-vendors',
    imports: [CommonModule, FormsModule],
    template: `
  <h2>Vendors</h2>
  <form (ngSubmit)="create()">
    <input [(ngModel)]="form.companyName" name="companyName" placeholder="Company" required />
    <input [(ngModel)]="form.email" name="email" placeholder="Email" type="email" required />
    <input [(ngModel)]="form.category" name="category" placeholder="Category" />
    <button type="submit">Add</button>
  </form>
  <table>
    <tr><th>Company</th><th>Email</th><th>Category</th><th>Active</th><th></th></tr>
    <tr *ngFor="let v of vendors">
      <td>{{v.companyName}}</td><td>{{v.email}}</td><td>{{v.category}}</td><td>{{v.isActive}}</td>
      <td><button (click)="deactivate(v)">Deactivate</button></td>
    </tr>
  </table>
  `,
    styles: [`table{width:100%;margin-top:12px;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}`]
})
export class VendorsComponent {
  private http = inject(HttpClient);
  vendors: any[] = [];
  form: any = { companyName: '', email: '', category: '' };

  ngOnInit(){ this.load(); }
  load(){ this.http.get<any[]>(`${environment.apiBase}/vendors`).subscribe(x => this.vendors = x); }

  create(){
    this.http.post(`${environment.apiBase}/vendors`, { ...this.form, isActive: true })
      .subscribe(_ => { this.form = { companyName:'', email:'', category:'' }; this.load(); });
  }

  deactivate(v:any){
    this.http.post(`${environment.apiBase}/vendors/${v.id}/deactivate`, {}).subscribe(_ => this.load());
  }
}
