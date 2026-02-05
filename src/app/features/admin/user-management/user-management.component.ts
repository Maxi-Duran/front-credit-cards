import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UserManagementService } from '../../../core/services/user-management.service';
import { 
  UserManagement, 
  UserStatus, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../../../core/models/user-management.models';
import { UserRole, Permission } from '../../../core/models/auth.models';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: UserManagement[] = [];
  displayedColumns: string[] = ['userId', 'name', 'email', 'role', 'status', 'lastLogin', 'actions'];
  loading = false;
  searchForm: FormGroup;

  UserRole = UserRole;
  UserStatus = UserStatus;

  constructor(
    private userManagementService: UserManagementService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      role: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    
    // Subscribe to search form changes
    this.searchForm.valueChanges.subscribe(() => {
      this.loadUsers();
    });
  }

  /**
   * Load users with current search criteria
   */
  loadUsers(): void {
    this.loading = true;
    const criteria = {
      query: this.searchForm.value.query || undefined,
      role: this.searchForm.value.role || undefined,
      status: this.searchForm.value.status || undefined
    };

    this.userManagementService.getUsers(criteria).subscribe({
      next: (response) => {
        this.users = response.users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showMessage('Error loading users', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Open dialog to add new user
   */
  addUser(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  /**
   * Open dialog to edit user
   */
  editUser(user: UserManagement): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser(user.id, result);
      }
    });
  }

  /**
   * Open dialog to confirm user deletion
   */
  deleteUser(user: UserManagement): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.performDeleteUser(user.id);
      }
    });
  }

  /**
   * Create new user
   */
  private createUser(request: CreateUserRequest): void {
    this.loading = true;
    this.userManagementService.createUser(request).subscribe({
      next: (user) => {
        this.showMessage('User created successfully', 'success');
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.showMessage(error.message || 'Error creating user', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Update existing user
   */
  private updateUser(id: string, request: Partial<UpdateUserRequest>): void {
    this.loading = true;
    const updateRequest: UpdateUserRequest = { id, ...request };
    
    this.userManagementService.updateUser(updateRequest).subscribe({
      next: (user) => {
        this.showMessage('User updated successfully', 'success');
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.showMessage(error.message || 'Error updating user', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Delete user
   */
  private performDeleteUser(id: string): void {
    this.loading = true;
    this.userManagementService.deleteUser({ id }).subscribe({
      next: () => {
        this.showMessage('User deleted successfully', 'success');
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showMessage(error.message || 'Error deleting user', 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'status-active';
      case UserStatus.INACTIVE:
        return 'status-inactive';
      case UserStatus.LOCKED:
        return 'status-locked';
      case UserStatus.PENDING:
        return 'status-pending';
      default:
        return '';
    }
  }

  /**
   * Get role display text
   */
  getRoleDisplay(role: UserRole): string {
    return role === UserRole.ADMIN ? 'Administrator' : 'Regular User';
  }

  /**
   * Show snackbar message
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }

  /**
   * Clear search filters
   */
  clearFilters(): void {
    this.searchForm.reset();
  }
}
