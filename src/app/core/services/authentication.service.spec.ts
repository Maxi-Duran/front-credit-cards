import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(AuthenticationService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate user with valid credentials', () => {
    const credentials = { userId: 'testuser', password: 'password', language: 'en' as const };
    
    service.login(credentials).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.user).toBeDefined();
    });
  });

  it('should reject invalid credentials', () => {
    const credentials = { userId: '', password: '', language: 'en' as const };
    
    service.login(credentials).subscribe(response => {
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  it('should check authentication status', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should logout user', () => {
    service.logout();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});