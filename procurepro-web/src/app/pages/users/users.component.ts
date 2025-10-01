import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManagementService, User, CreateUserRequest, UpdateUserRequest } from '../../services/user-management.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>User Management</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create User</button>
      </div>

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Display Name</th>
              <th>Company</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.email }}</td>
              <td>{{ user.displayName }}</td>
              <td>{{ user.companyName || '-' }}</td>
              <td>
                <span class="role-badge" *ngFor="let role of user.roles">{{ role }}</span>
              </td>
              <td>
                <span class="status-badge" [class.active]="user.isActive">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" (click)="editUser(user)">Edit</button>
                <button class="btn btn-sm btn-warning" *ngIf="user.isActive" (click)="deactivateUser(user.id)">
                  Deactivate
                </button>
                <button class="btn btn-sm btn-success" *ngIf="!user.isActive" (click)="activateUser(user.id)">
                  Activate
                </button>
                <button class="btn btn-sm btn-info" (click)="openResetPasswordModal(user)">Reset Pwd</button>
                <button class="btn btn-sm btn-danger" (click)="deleteUser(user.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit' : 'Create' }} User</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="currentUserForm.email" class="form-control" [disabled]="isEditing">
            </div>
            <div class="form-group" *ngIf="!isEditing">
              <label>Password</label>
              <input type="password" [(ngModel)]="currentUserForm.password" class="form-control">
            </div>
            <div class="form-group">
              <label>Display Name</label>
              <input type="text" [(ngModel)]="currentUserForm.displayName" class="form-control">
            </div>
            <div class="form-group">
              <label>Company Name</label>
              <input type="text" [(ngModel)]="currentUserForm.companyName" class="form-control">
            </div>
            <div class="form-group">
              <label>Roles</label>
              <div class="roles-checkboxes">
                <label *ngFor="let role of availableRoles">
                  <input type="checkbox" [checked]="currentUserForm.roles.includes(role)" (change)="toggleRole(role)">
                  {{ role }}
                </label>
              </div>
            </div>
            <div class="form-group" *ngIf="isEditing">
              <label>
                <input type="checkbox" [(ngModel)]="currentUserForm.isActive">
                Active
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveUser()">Save</button>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div class="modal" *ngIf="showResetPasswordModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Reset Password</h2>
            <button class="close-btn" (click)="closeResetPasswordModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>New Password</label>
              <input type="password" [(ngModel)]="newPassword" class="form-control">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeResetPasswordModal()">Cancel</button>
            <button class="btn btn-primary" (click)="resetPassword()">Reset</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .users-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; }
    th { background: #f9fafb; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    tbody tr { border-bottom: 1px solid #e5e7eb; }
    tbody tr:hover { background: #f9fafb; }
    .role-badge { display: inline-block; padding: 0.25rem 0.5rem; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 0.75rem; margin-right: 0.25rem; }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; background: #fee2e2; color: #991b1b; }
    .status-badge.active { background: #d1fae5; color: #065f46; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 0.25rem; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-info { background: #0ea5e9; color: white; }
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
    .roles-checkboxes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .roles-checkboxes label { display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer; }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  showResetPasswordModal = false;
  isEditing = false;
  currentUserForm: any = this.getEmptyUserForm();
  selectedUserId = '';
  newPassword = '';
  availableRoles = ['Admin', 'ProcurementManager', 'Approver', 'Vendor'];

  constructor(private userService: UserManagementService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error('Error loading users:', err)
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentUserForm = this.getEmptyUserForm();
    this.showModal = true;
  }

  editUser(user: User) {
    this.isEditing = true;
    this.selectedUserId = user.id;
    this.currentUserForm = {
      email: user.email,
      displayName: user.displayName,
      companyName: user.companyName || '',
      isActive: user.isActive,
      roles: [...user.roles],
      password: ''
    };
    this.showModal = true;
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Error deleting user:', err)
      });
    }
  }

  deactivateUser(id: string) {
    this.userService.deactivateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Error deactivating user:', err)
    });
  }

  activateUser(id: string) {
    this.userService.activateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Error activating user:', err)
    });
  }

  saveUser() {
    if (this.isEditing) {
      const updateRequest: UpdateUserRequest = {
        displayName: this.currentUserForm.displayName,
        companyName: this.currentUserForm.companyName,
        isActive: this.currentUserForm.isActive,
        roles: this.currentUserForm.roles
      };
      this.userService.updateUser(this.selectedUserId, updateRequest).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => console.error('Error updating user:', err)
      });
    } else {
      const createRequest: CreateUserRequest = {
        email: this.currentUserForm.email,
        password: this.currentUserForm.password,
        displayName: this.currentUserForm.displayName,
        companyName: this.currentUserForm.companyName,
        roles: this.currentUserForm.roles
      };
      this.userService.createUser(createRequest).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => console.error('Error creating user:', err)
      });
    }
  }

  toggleRole(role: string) {
    const index = this.currentUserForm.roles.indexOf(role);
    if (index > -1) {
      this.currentUserForm.roles.splice(index, 1);
    } else {
      this.currentUserForm.roles.push(role);
    }
  }

  openResetPasswordModal(user: User) {
    this.selectedUserId = user.id;
    this.newPassword = '';
    this.showResetPasswordModal = true;
  }

  resetPassword() {
    this.userService.resetPassword(this.selectedUserId, { newPassword: this.newPassword }).subscribe({
      next: () => {
        alert('Password reset successfully');
        this.closeResetPasswordModal();
      },
      error: (err) => console.error('Error resetting password:', err)
    });
  }

  closeModal() {
    this.showModal = false;
  }

  closeResetPasswordModal() {
    this.showResetPasswordModal = false;
  }

  getEmptyUserForm() {
    return {
      email: '',
      password: '',
      displayName: '',
      companyName: '',
      isActive: true,
      roles: []
    };
  }
}

