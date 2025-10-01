import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleManagementService, Role } from '../../services/role-management.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Role Management</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create Role</button>
      </div>

      <div class="roles-grid">
        <div class="role-card" *ngFor="let role of roles">
          <div class="role-header">
            <h3>{{ role.name }}</h3>
            <span class="user-count">{{ role.userCount }} users</span>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-info" (click)="viewRoleDetails(role.id)">View Users</button>
            <button class="btn btn-sm btn-secondary" (click)="editRole(role)">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="deleteRole(role.id)" [disabled]="isSystemRole(role.name)">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit' : 'Create' }} Role</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Role Name</label>
              <input type="text" [(ngModel)]="currentRoleName" class="form-control" placeholder="Role Name">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveRole()">Save</button>
          </div>
        </div>
      </div>

      <!-- Role Details Modal -->
      <div class="modal" *ngIf="showDetailsModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedRole?.name }} - Users</h2>
            <button class="close-btn" (click)="closeDetailsModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="users-list">
              <div class="user-item" *ngFor="let user of selectedRole?.users">
                <div>
                  <strong>{{ user.displayName }}</strong>
                  <span class="email">{{ user.email }}</span>
                </div>
                <button class="btn btn-sm btn-danger" (click)="removeUserFromRole(user.id)">Remove</button>
              </div>
              <p *ngIf="!selectedRole || !selectedRole.users || selectedRole.users.length === 0" class="no-users">
                No users assigned to this role.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeDetailsModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .role-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .role-header { margin-bottom: 1rem; }
    .role-header h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .user-count { display: inline-block; padding: 0.25rem 0.75rem; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 0.875rem; }
    .actions { display: flex; gap: 0.5rem; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-info { background: #0ea5e9; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1.5rem; border-top: 1px solid #e5e7eb; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
    .users-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .user-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 6px; }
    .email { display: block; color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; }
    .no-users { text-align: center; color: #6b7280; padding: 2rem; }
  `]
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  selectedRole: Role | null = null;
  showModal = false;
  showDetailsModal = false;
  isEditing = false;
  currentRoleName = '';
  currentRoleId = '';
  systemRoles = ['Admin', 'ProcurementManager', 'Approver', 'Vendor'];

  constructor(private roleService: RoleManagementService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getAllRoles().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentRoleName = '';
    this.showModal = true;
  }

  editRole(role: Role) {
    this.isEditing = true;
    this.currentRoleId = role.id;
    this.currentRoleName = role.name;
    this.showModal = true;
  }

  deleteRole(id: string) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe({
        next: () => this.loadRoles(),
        error: (err) => alert(err.error || 'Error deleting role')
      });
    }
  }

  saveRole() {
    if (this.isEditing) {
      this.roleService.updateRole(this.currentRoleId, { name: this.currentRoleName }).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();
        },
        error: (err) => console.error('Error updating role:', err)
      });
    } else {
      this.roleService.createRole({ name: this.currentRoleName }).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();
        },
        error: (err) => console.error('Error creating role:', err)
      });
    }
  }

  viewRoleDetails(id: string) {
    this.roleService.getRole(id).subscribe({
      next: (role) => {
        this.selectedRole = role;
        this.showDetailsModal = true;
      },
      error: (err) => console.error('Error loading role details:', err)
    });
  }

  removeUserFromRole(userId: string) {
    if (this.selectedRole && confirm('Remove this user from the role?')) {
      const roleId = this.selectedRole.id;
      this.roleService.removeUserFromRole(roleId, userId).subscribe({
        next: () => this.viewRoleDetails(roleId),
        error: (err) => console.error('Error removing user from role:', err)
      });
    }
  }

  isSystemRole(name: string): boolean {
    return this.systemRoles.includes(name);
  }

  closeModal() {
    this.showModal = false;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedRole = null;
  }
}

