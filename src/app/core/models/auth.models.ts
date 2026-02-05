export enum UserRole {
  REGULAR = 'regular',
  ADMIN = 'admin'
}

export enum Permission {
  VIEW_ACCOUNTS = 'view_accounts',
  UPDATE_ACCOUNTS = 'update_accounts',
  VIEW_CARDS = 'view_cards',
  UPDATE_CARDS = 'update_cards',
  VIEW_TRANSACTIONS = 'view_transactions',
  ADD_TRANSACTIONS = 'add_transactions',
  VIEW_REPORTS = 'view_reports',
  MANAGE_USERS = 'manage_users',
  MANAGE_TRANSACTION_TYPES = 'manage_transaction_types'
}

export interface LoginCredentials {
  userId: string;
  password: string;
  language: 'es' | 'en';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  language: 'es' | 'en';
  lastLogin?: Date;
  sessionTimeout?: number;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
  message?: string;
}

export interface TokenPayload {
  sub: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}