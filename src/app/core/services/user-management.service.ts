import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';

import { ApiService, ApiResponse } from './api.service';
import { 
  UserManagement, 
  CreateUserRequest, 
  UpdateUserRequest, 
  DeleteUserRequest,
  UserSearchCriteria,
  UserListResponse,
  UserStatus
} from '../models/user-management.models';
import { UserRole, Permission } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  // Mock data for development
  private mockUsers: UserManagement[] = [
    {
      id: '1',
      userId: 'admin',
      name: 'Administrador Principal',
      email: 'admin@carddemo.com',
      role: UserRole.ADMIN,
      permissions: [
        Permission.VIEW_ACCOUNTS,
        Permission.UPDATE_ACCOUNTS,
        Permission.VIEW_CARDS,
        Permission.UPDATE_CARDS,
        Permission.VIEW_TRANSACTIONS,
        Permission.ADD_TRANSACTIONS,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_TRANSACTION_TYPES
      ],
      status: UserStatus.ACTIVE,
      createdDate: new Date('2024-01-01'),
      lastLogin: new Date('2024-02-05')
    },
    {
      id: '2',
      userId: 'user001',
      name: 'Juan Pérez',
      email: 'juan.perez@carddemo.com',
      role: UserRole.REGULAR,
      permissions: [
        Permission.VIEW_ACCOUNTS,
        Permission.UPDATE_ACCOUNTS,
        Permission.VIEW_CARDS,
        Permission.UPDATE_CARDS,
        Permission.VIEW_TRANSACTIONS,
        Permission.ADD_TRANSACTIONS,
        Permission.VIEW_REPORTS
      ],
      status: UserStatus.ACTIVE,
      createdDate: new Date('2024-01-15'),
      lastLogin: new Date('2024-02-04')
    },
    {
      id: '3',
      userId: 'user002',
      name: 'María García',
      email: 'maria.garcia@carddemo.com',
      role: UserRole.REGULAR,
      permissions: [
        Permission.VIEW_ACCOUNTS,
        Permission.VIEW_CARDS,
        Permission.VIEW_TRANSACTIONS,
        Permission.VIEW_REPORTS
      ],
      status: UserStatus.ACTIVE,
      createdDate: new Date('2024-01-20'),
      lastLogin: new Date('2024-02-03')
    },
    {
      id: '4',
      userId: 'user003',
      name: 'Carlos López',
      email: 'carlos.lopez@carddemo.com',
      role: UserRole.REGULAR,
      permissions: [
        Permission.VIEW_ACCOUNTS,
        Permission.UPDATE_ACCOUNTS,
        Permission.VIEW_CARDS,
        Permission.VIEW_TRANSACTIONS
      ],
      status: UserStatus.INACTIVE,
      createdDate: new Date('2024-02-01'),
      lastLogin: new Date('2024-02-01')
    }
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Get all users with optional filtering
   */
  getUsers(criteria?: UserSearchCriteria): Observable<UserListResponse> {
    // Mock implementation
    return timer(500).pipe(
      map(() => {
        let filteredUsers = [...this.mockUsers];

        // Apply filters
        if (criteria?.query) {
          const query = criteria.query.toLowerCase();
          filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.userId.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
          );
        }

        if (criteria?.role) {
          filteredUsers = filteredUsers.filter(user => user.role === criteria.role);
        }

        if (criteria?.status) {
          filteredUsers = filteredUsers.filter(user => user.status === criteria.status);
        }

        // Apply pagination
        const page = criteria?.page || 1;
        const pageSize = criteria?.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          pageSize
        };
      })
    );

    // Real API implementation (commented out)
    // const params = this.buildQueryParams(criteria);
    // return this.apiService.get<UserListResponse>(
    //   environment.endpoints.admin.users,
    //   params
    // ).pipe(map(response => response.data));
  }

  /**
   * Get user by ID
   */
  getUser(id: string): Observable<UserManagement> {
    // Mock implementation
    return timer(300).pipe(
      map(() => {
        const user = this.mockUsers.find(u => u.id === id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      })
    );

    // Real API implementation (commented out)
    // return this.apiService.get<UserManagement>(
    //   `${environment.endpoints.admin.users}/${id}`
    // ).pipe(map(response => response.data));
  }

  /**
   * Create new user
   */
  createUser(request: CreateUserRequest): Observable<UserManagement> {
    // Mock implementation
    return timer(800).pipe(
      map(() => {
        // Check if userId already exists
        if (this.mockUsers.some(u => u.userId === request.userId)) {
          throw new Error('User ID already exists');
        }

        const newUser: UserManagement = {
          id: (this.mockUsers.length + 1).toString(),
          userId: request.userId,
          name: request.name,
          email: request.email,
          role: request.role,
          permissions: request.permissions,
          status: request.status || UserStatus.ACTIVE,
          createdDate: new Date(),
          lastModified: new Date()
        };

        this.mockUsers.push(newUser);
        return newUser;
      })
    );

    // Real API implementation (commented out)
    // return this.apiService.post<UserManagement>(
    //   environment.endpoints.admin.users,
    //   request
    // ).pipe(map(response => response.data));
  }

  /**
   * Update existing user
   */
  updateUser(request: UpdateUserRequest): Observable<UserManagement> {
    // Mock implementation
    return timer(800).pipe(
      map(() => {
        const userIndex = this.mockUsers.findIndex(u => u.id === request.id);
        if (userIndex === -1) {
          throw new Error('User not found');
        }

        const updatedUser: UserManagement = {
          ...this.mockUsers[userIndex],
          ...(request.name && { name: request.name }),
          ...(request.email && { email: request.email }),
          ...(request.role && { role: request.role }),
          ...(request.permissions && { permissions: request.permissions }),
          ...(request.status && { status: request.status }),
          lastModified: new Date()
        };

        this.mockUsers[userIndex] = updatedUser;
        return updatedUser;
      })
    );

    // Real API implementation (commented out)
    // return this.apiService.put<UserManagement>(
    //   `${environment.endpoints.admin.users}/${request.id}`,
    //   request
    // ).pipe(map(response => response.data));
  }

  /**
   * Delete user
   */
  deleteUser(request: DeleteUserRequest): Observable<void> {
    // Mock implementation
    return timer(600).pipe(
      map(() => {
        const userIndex = this.mockUsers.findIndex(u => u.id === request.id);
        if (userIndex === -1) {
          throw new Error('User not found');
        }

        // Don't allow deleting the main admin
        if (this.mockUsers[userIndex].userId === 'admin') {
          throw new Error('Cannot delete main administrator');
        }

        this.mockUsers.splice(userIndex, 1);
        return void 0;
      })
    );

    // Real API implementation (commented out)
    // return this.apiService.delete<void>(
    //   `${environment.endpoints.admin.users}/${request.id}`,
    //   { reason: request.reason }
    // ).pipe(map(() => void 0));
  }

  /**
   * Get available permissions
   */
  getAvailablePermissions(): Permission[] {
    return Object.values(Permission);
  }

  /**
   * Get available roles
   */
  getAvailableRoles(): UserRole[] {
    return Object.values(UserRole);
  }

  /**
   * Get available statuses
   */
  getAvailableStatuses(): UserStatus[] {
    return Object.values(UserStatus);
  }

  /**
   * Build query parameters from search criteria
   */
  private buildQueryParams(criteria?: UserSearchCriteria): Record<string, any> {
    if (!criteria) {
      return {};
    }

    const params: Record<string, any> = {};

    if (criteria.query) params['query'] = criteria.query;
    if (criteria.role) params['role'] = criteria.role;
    if (criteria.status) params['status'] = criteria.status;
    if (criteria.page) params['page'] = criteria.page;
    if (criteria.pageSize) params['pageSize'] = criteria.pageSize;

    return params;
  }
}
