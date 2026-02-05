import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth token to request if available
    const authReq = this.addTokenToRequest(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && !this.isAuthEndpoint(req.url)) {
          return this.handle401Error(authReq, next);
        }

        // Handle other HTTP errors
        return throwError(() => error);
      })
    );
  }

  /**
   * Add authentication token to request headers
   */
  private addTokenToRequest(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    
    if (token && !this.isAuthEndpoint(request.url)) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return request;
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokenResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokenResponse.token);
          
          // Retry the original request with new token
          const newAuthReq = this.addTokenToRequest(request);
          return next.handle(newAuthReq);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          // Refresh failed, logout user
          this.authService.logout().subscribe();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          const newAuthReq = this.addTokenToRequest(request);
          return next.handle(newAuthReq);
        })
      );
    }
  }

  /**
   * Check if the request is to an authentication endpoint
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      environment.endpoints.auth.login,
      environment.endpoints.auth.logout,
      environment.endpoints.auth.refresh
    ];

    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}