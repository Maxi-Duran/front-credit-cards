import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpParams,HttpHeaders } from '@angular/common/http';
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
    const storedUser = this.getStoredUser();
    
    if (token && refreshToken && storedUser) {
      try {
        const payload = this.decodeToken(token);
        if (this.isTokenValid(payload)) {
          // Use stored user data instead of recreating from token
          this.setCurrentUser(storedUser);
          this.setToken(token);
          this.startSessionMonitoring();
        } else {
          // Token expired, clear everything
          this.clearAuthState();
        }
      } catch (error) {
        this.clearAuthState();
      }
    }
  }

  /**
   * Login with credentials - Real API implementation
   */
login(credentials: LoginCredentials): Observable<AuthResponse> {
  // 1. Cuerpo como objeto plano (Angular lo convertirá a JSON automáticamente)
  const loginRequest = {
    username: credentials.userId,
    password: credentials.password
  };

  // 2. Cabeceras explícitas para evitar el "text/plain"
  const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  return this.http.post<{
    access_token: string;
    token_type: string;
    expires_in: number;
    user: any;
  }>(`${environment.apiUrl}${environment.endpoints.auth.login}`, loginRequest, httpOptions)
  .pipe(
    map(response => {
      // Tu lógica de transformación se mantiene igual
      const user: User = {
        id: response.user.id.toString(),
        name: response.user.username,
        role: response.user.username.toLowerCase().includes('admin') ? UserRole.ADMIN : UserRole.REGULAR,
        permissions: this.getDefaultPermissions(response.user.username),
        language: credentials.language,
        lastLogin: new Date(),
        sessionTimeout: response.expires_in * 1000
      };

      return {
        success: true,
        user: user,
        token: response.access_token,
        refreshToken: response.access_token,
        expiresIn: response.expires_in,
        message: credentials.language === 'es' ? 'Login exitoso' : 'Login successful'
      };
    }),
    tap(authResponse => {
      console.log('Login successful:', credentials.userId);
      this.handleSuccessfulLogin(authResponse);
    }),
    catchError(error => {
      // Si aquí ves un error 401, el problema es el usuario/password en la DB
      console.error('Error detallado en el login:', error);
      return throwError(() => error);
    })
  );
}
  /**
   * Get default permissions based on username
   */
  private getDefaultPermissions(username: string): Permission[] {
    const isAdmin = username.toLowerCase().includes('admin');
    
    if (isAdmin) {
      return [
        Permission.VIEW_ACCOUNTS,
        Permission.UPDATE_ACCOUNTS,
        Permission.VIEW_CARDS,
        Permission.UPDATE_CARDS,
        Permission.VIEW_TRANSACTIONS,
        Permission.ADD_TRANSACTIONS,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_TRANSACTION_TYPES
      ];
    }
    
    return [
      Permission.VIEW_ACCOUNTS,
      Permission.UPDATE_ACCOUNTS,
      Permission.VIEW_CARDS,
      Permission.UPDATE_CARDS,
      Permission.VIEW_TRANSACTIONS,
      Permission.ADD_TRANSACTIONS,
      Permission.VIEW_REPORTS
    ];
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
    this.storeUser(authResponse.user); // Store user data in localStorage
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
    this.removeStoredUser();
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
   * Store user data in localStorage
   */
  private storeUser(user: User): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('carddemo_user', JSON.stringify(user));
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('carddemo_user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
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
   * Remove stored user from localStorage
   */
  private removeStoredUser(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('carddemo_user');
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