import { UserRole, Permission } from './auth.models';

export interface UserManagement {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  createdDate: Date;
  lastLogin?: Date;
  lastModified?: Date;
  modifiedBy?: string;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  PENDING = 'pending'
}

export interface CreateUserRequest {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: Permission[];
  status?: UserStatus;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole;
  permissions?: Permission[];
  status?: UserStatus;
  password?: string;
}

export interface DeleteUserRequest {
  id: string;
  reason?: string;
}

export interface UserSearchCriteria {
  query?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

export interface UserListResponse {
  users: UserManagement[];
  total: number;
  page: number;
  pageSize: number;
}
