import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'vendors', canActivate: [authGuard, roleGuard('ProcurementManager')], loadComponent: () => import('./pages/vendors/vendors.component').then(m => m.VendorsComponent) },
  { path: 'rfq', canActivate: [authGuard], loadComponent: () => import('./pages/rfq/rfq.component').then(m => m.RFQComponent) },
  { path: 'purchase-requisitions', canActivate: [authGuard], loadComponent: () => import('./pages/purchase-requisitions/purchase-requisitions.component').then(m => m.PurchaseRequisitionsComponent) },
  { path: 'bids', canActivate: [authGuard], loadComponent: () => import('./pages/bids/bids.component').then(m => m.BidsComponent) },
  { path: 'purchase-orders', canActivate: [authGuard], loadComponent: () => import('./pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent) },
  { path: 'invoices', canActivate: [authGuard], loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent) },
  { path: 'users', canActivate: [authGuard, roleGuard('Admin')], loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
  { path: 'roles', canActivate: [authGuard, roleGuard('Admin')], loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent) }
];
