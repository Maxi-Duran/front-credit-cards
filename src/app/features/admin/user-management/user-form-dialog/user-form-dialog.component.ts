import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

import { UserManagement, UserStatus, CreateUserRequest } from '../../../../core/models/user-management.models';
import { UserRole, Permission } from '../../../../core/models/auth.models';
import { UserManagementService } from '../../../../core/services/user-management.service';

export interface UserFormDialogData {
  mode: 'create' | 'edit';
  user?: UserManagement;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  userForm: FormGroup;
  availablePermissions: Permission[] = [];
  availableRoles: UserRole[] = [];
  availableStatuses: UserStatus[] = [];
  isEditMode: boolean;

  UserRole = UserRole;
  UserStatus = UserStatus;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserFormDialogComponent>,
    private userManagementService: UserManagementService,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.availablePermissions = this.userManagementService.getAvailablePermissions();
    this.availableRoles = this.userManagementService.getAvailableRoles();
    this.availableStatuses = this.userManagementService.getAvailableStatuses();

    if (this.isEditMode && this.data.user) {
      this.populateForm(this.data.user);
    }

    // Subscribe to role changes to update permissions
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      this.updatePermissionsForRole(role);
    });
  }

  /**
   * Create form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      userId: [
        { value: '', disabled: this.isEditMode },
        [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
      ],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]
      ],
      role: [UserRole.REGULAR, Validators.required],
      status: [UserStatus.ACTIVE, Validators.required],
      permissions: [[], Validators.required]
    });
  }

  /**
   * Populate form with user data
   */
  private populateForm(user: UserManagement): void {
    this.userForm.patchValue({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions
    });
  }

  /**
   * Update permissions based on role
   */
  private updatePermissionsForRole(role: UserRole): void {
    if (role === UserRole.ADMIN) {
      // Admin gets all permissions
      this.userForm.patchValue({
        permissions: this.availablePermissions
      });
    } else if (role === UserRole.REGULAR) {
      // Regular user gets basic permissions
      const basicPermissions = [
        Permission.VIEW_ACCOUNTS,
        Permission.VIEW_CARDS,
        Permission.VIEW_TRANSACTIONS,
        Permission.VIEW_REPORTS
      ];
      this.userForm.patchValue({
        permissions: basicPermissions
      });
    }
  }

  /**
   * Toggle permission selection
   */
  togglePermission(permission: Permission): void {
    const permissions = this.userForm.value.permissions as Permission[];
    const index = permissions.indexOf(permission);

    if (index >= 0) {
      permissions.splice(index, 1);
    } else {
      permissions.push(permission);
    }

    this.userForm.patchValue({ permissions });
  }

  /**
   * Check if permission is selected
   */
  isPermissionSelected(permission: Permission): boolean {
    const permissions = this.userForm.value.permissions as Permission[];
    return permissions.includes(permission);
  }

  /**
   * Get permission display name
   */
  getPermissionDisplay(permission: Permission): string {
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.getRawValue();
      
      if (this.isEditMode) {
        // For edit mode, only send changed fields
        const updateData: any = {
          name: formValue.name,
          email: formValue.email,
          role: formValue.role,
          status: formValue.status,
          permissions: formValue.permissions
        };

        // Include password only if it was changed
        if (formValue.password) {
          updateData.password = formValue.password;
        }

        this.dialogRef.close(updateData);
      } else {
        // For create mode, send all fields
        const createData: CreateUserRequest = {
          userId: formValue.userId,
          name: formValue.name,
          email: formValue.email,
          password: formValue.password,
          role: formValue.role,
          status: formValue.status,
          permissions: formValue.permissions
        };

        this.dialogRef.close(createData);
      }
    }
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get form title
   */
  getTitle(): string {
    return this.isEditMode ? 'Edit User' : 'Add New User';
  }
}
