import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { ApiService, ApiResponse } from './api.service';
import { 
  LoginCredentials, 
  User, 
  AuthResponse, 
  UserRole, 
  Permission,
  RefreshTokenRequest,
  RefreshTokenResponse,
  TokenPayload
} from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private sessionTimeoutTimer: any;

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeFromStorage();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeFromStorage(): void {
    // Check if we're in browser environment (not SSR)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const token = this.getStoredToken();
    const refreshToken = this.getStoredRefreshToken();
    
    if (token && refreshToken) {
      try {
        const payload = this.decodeToken(token);
        if (this.isTokenValid(payload)) {
          const user = this.createUserFromToken(payload);
          this.setCurrentUser(user);
          this.setToken(token);
          this.startSessionMonitoring();
        } else {
          // Try to refresh the token (commented out for mock version)
          // this.refreshToken().subscribe({
          //   error: () => this.clearAuthState()
          // });
          this.clearAuthState();
        }
      } catch (error) {
        this.clearAuthState();
      }
    }
  }

  /**
   * Login with credentials - ORIGINAL (commented out for development without backend)
   */
  // login(credentials: LoginCredentials): Observable<AuthResponse> {
  //   return this.apiService.post<AuthResponse>(environment.endpoints.auth.login, credentials)
  //     .pipe(
  //       map(response => response.data),
  //       tap(authResponse => {
  //         if (authResponse.success) {
  //           this.handleSuccessfulLogin(authResponse);
  //         }
  //       }),
  //       catchError(error => {
  //         console.error('Login failed:', error);
  //         return throwError(() => error);
  //       })
  //     );
  // }

  /**
   * Login with credentials - MOCK VERSION (for development without backend)
   * Automatically logs in any user with mock data
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Simulate API delay
    return timer(1000).pipe(
      map(() => {
        // Determine user role based on userId (for testing purposes)
        const isAdmin = credentials.userId.toLowerCase().includes('admin') || 
                       credentials.userId.toLowerCase() === 'admin' ||
                       credentials.userId === '1';
        
        // Create mock user
        const mockUser: User = {
          id: credentials.userId,
          name: isAdmin ? 'Administrador Demo' : 'Usuario Demo',
          role: isAdmin ? UserRole.ADMIN : UserRole.REGULAR,
          permissions: isAdmin ? [
            Permission.VIEW_ACCOUNTS,
            Permission.UPDATE_ACCOUNTS,
            Permission.VIEW_CARDS,
            Permission.UPDATE_CARDS,
            Permission.VIEW_TRANSACTIONS,
            Permission.ADD_TRANSACTIONS,
            Permission.VIEW_REPORTS,
            Permission.MANAGE_USERS,
            Permission.MANAGE_TRANSACTION_TYPES
          ] : [
            Permission.VIEW_ACCOUNTS,
            Permission.UPDATE_ACCOUNTS,
            Permission.VIEW_CARDS,
            Permission.UPDATE_CARDS,
            Permission.VIEW_TRANSACTIONS,
            Permission.ADD_TRANSACTIONS,
            Permission.VIEW_REPORTS
          ],
          language: credentials.language,
          lastLogin: new Date(),
          sessionTimeout: 3600000 // 1 hour
        };

        // Create mock auth response
        const mockAuthResponse: AuthResponse = {
          success: true,
          user: mockUser,
          token: this.generateMockJWT(mockUser),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          expiresIn: 3600,
          message: credentials.language === 'es' ? 'Login exitoso' : 'Login successful'
        };

        return mockAuthResponse;
      }),
      tap(authResponse => {
        console.log('Mock login successful for user:', credentials.userId);
        this.handleSuccessfulLogin(authResponse);
      }),
      catchError(error => {
        console.error('Mock login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<void> {
    const refreshToken = this.getStoredRefreshToken();
    
    // Call logout endpoint if refresh token exists
    const logoutRequest = refreshToken 
      ? this.apiService.post<void>(environment.endpoints.auth.logout, { refreshToken })
      : new Observable<ApiResponse<void>>(observer => {
          observer.next({ success: true, data: undefined });
          observer.complete();
        });

    return logoutRequest.pipe(
      tap(() => {
        this.clearAuthState();
        this.router.navigate(['/auth/login']);
      }),
      map(() => void 0),
      catchError(error => {
        // Even if logout fails on server, clear local state
        this.clearAuthState();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getStoredRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    
    return this.apiService.post<RefreshTokenResponse>(environment.endpoints.auth.refresh, request)
      .pipe(
        map(response => response.data),
        tap(tokenResponse => {
          this.storeToken(tokenResponse.token);
          this.storeRefreshToken(tokenResponse.refreshToken);
          this.setToken(tokenResponse.token);
          
          // Update user from new token
          const payload = this.decodeToken(tokenResponse.token);
          const user = this.createUserFromToken(payload);
          this.setCurrentUser(user);
          
          this.startSessionMonitoring();
        }),
        catchError(error => {
          this.clearAuthState();
          return throwError(() => error);
        })
      );
  }

  /**
   * Get current user
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Get current user synchronously
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUserValue();
    const token = this.getStoredToken();
    
    if (!user || !token) {
      return false;
    }

    try {
      const payload = this.decodeToken(token);
      return this.isTokenValid(payload);
    } catch {
      return false;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === role;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUserValue();
    return user?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Reset session timeout (called by session timeout service)
   */
  resetSessionTimeout(): void {
    this.startSessionMonitoring();
  }

  /**
   * Handle successful login
   */
  private handleSuccessfulLogin(authResponse: AuthResponse): void {
    this.storeToken(authResponse.token);
    this.storeRefreshToken(authResponse.refreshToken);
    this.setCurrentUser(authResponse.user);
    this.setToken(authResponse.token);
    this.startSessionMonitoring();
  }

  /**
   * Set current user
   */
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  /**
   * Set authentication token
   */
  private setToken(token: string): void {
    this.tokenSubject.next(token);
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    this.removeStoredToken();
    this.removeStoredRefreshToken();
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.stopSessionMonitoring();
  }

  /**
   * Start session monitoring (simplified - will be handled by SessionTimeoutService)
   */
  private startSessionMonitoring(): void {
    this.stopSessionMonitoring();
    
    // Basic session timeout as fallback
    const timeout = environment.security.sessionTimeout;
    this.sessionTimeoutTimer = timer(timeout).subscribe(() => {
      this.logout().subscribe();
    });
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionTimeoutTimer) {
      this.sessionTimeoutTimer.unsubscribe();
      this.sessionTimeoutTimer = null;
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): TokenPayload {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Check if token is valid (not expired)
   */
  private isTokenValid(payload: TokenPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * Create user object from token payload
   */
  private createUserFromToken(payload: TokenPayload): User {
    return {
      id: payload.sub,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
      language: 'es' // Default language, can be updated from user preferences
    };
  }

  /**
   * Store token in localStorage
   */
  private storeToken(token: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(environment.security.tokenKey, token);
    }
  }

  /**
   * Store refresh token in localStorage
   */
  private storeRefreshToken(refreshToken: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(environment.security.refreshTokenKey, refreshToken);
    }
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(environment.security.tokenKey);
    }
    return null;
  }

  /**
   * Get stored refresh token from localStorage
   */
  private getStoredRefreshToken(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(environment.security.refreshTokenKey);
    }
    return null;
  }

  /**
   * Remove stored token from localStorage
   */
  private removeStoredToken(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(environment.security.tokenKey);
    }
  }

  /**
   * Generate mock JWT token for development
   */
  private generateMockJWT(user: User): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload: TokenPayload = {
      sub: user.id,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    // Create mock JWT (not cryptographically secure, just for development)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Remove stored refresh token from localStorage
   */
  private removeStoredRefreshToken(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(environment.security.refreshTokenKey);
    }
  }
}