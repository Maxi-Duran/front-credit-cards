import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { AuthenticationService } from '../../../core/services/authentication.service';
import { LoginCredentials, UserRole } from '../../../core/models/auth.models';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

interface LanguageOption {
  code: 'es' | 'en';
  name: string;
  flag: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  loginAttempts = 0;
  maxLoginAttempts = 3;
  selectedLanguage: 'es' | 'en' = 'es';
  
  private destroy$ = new Subject<void>();

  // Language options
  languages: LanguageOption[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  // Translations
  translations = {
    es: {
      title: 'CardDemo - Iniciar Sesión',
      subtitle: 'Sistema de Gestión de Tarjetas de Crédito',
      userId: 'ID de Usuario',
      password: 'Contraseña',
      language: 'Idioma',
      login: 'Iniciar Sesión',
      loginError: 'Error de autenticación',
      invalidCredentials: 'Usuario o contraseña incorrectos',
      maxAttemptsReached: 'Máximo número de intentos alcanzado. Intente más tarde.',
      networkError: 'Error de conexión. Verifique su conexión a internet.',
      userIdRequired: 'El ID de usuario es requerido',
      passwordRequired: 'La contraseña es requerida',
      userIdMinLength: 'El ID de usuario debe tener al menos 3 caracteres',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
      loading: 'Iniciando sesión...'
    },
    en: {
      title: 'CardDemo - Sign In',
      subtitle: 'Credit Card Management System',
      userId: 'User ID',
      password: 'Password',
      language: 'Language',
      login: 'Sign In',
      loginError: 'Authentication error',
      invalidCredentials: 'Invalid username or password',
      maxAttemptsReached: 'Maximum login attempts reached. Please try again later.',
      networkError: 'Connection error. Please check your internet connection.',
      userIdRequired: 'User ID is required',
      passwordRequired: 'Password is required',
      userIdMinLength: 'User ID must be at least 3 characters',
      passwordMinLength: 'Password must be at least 6 characters',
      loading: 'Signing in...'
    }
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private router: Router,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectToMainMenu();
      return;
    }

    // Set default language from localStorage or environment (only in browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedLanguage = localStorage.getItem('carddemo_language') as 'es' | 'en';
      if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
        this.selectedLanguage = savedLanguage;
        this.loginForm.patchValue({ language: savedLanguage });
      }
    }

    // Watch for language changes
    this.loginForm.get('language')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((language: 'es' | 'en') => {
        this.onLanguageChange(language);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create reactive login form with validation
   */
  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      userId: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      language: [this.selectedLanguage, Validators.required]
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.showError(this.t('maxAttemptsReached'));
      return;
    }

    this.performLogin();
  }

  /**
   * Perform login operation
   */
  private performLogin(): void {
    this.isLoading = true;
    this.loadingService.setLoading(true);

    const credentials: LoginCredentials = {
      userId: this.loginForm.get('userId')?.value.trim(),
      password: this.loginForm.get('password')?.value,
      language: this.loginForm.get('language')?.value
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleLoginSuccess(response);
          console.log("correcto")
        },
        error: (error) => {
          this.handleLoginError(error);
          console.log("error")
        },
        complete: () => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        }
      });
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(response: any): void {
    this.loginAttempts = 0;
    
    // Save language preference (only in browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('carddemo_language', this.selectedLanguage);
    }
    
    this.notificationService.showSuccess(
      this.selectedLanguage === 'es' 
        ? `Bienvenido, ${response.user?.name || 'Usuario'}` 
        : `Welcome, ${response.user?.name || 'User'}`
    );

    this.redirectToMainMenu();
  }

  /**
   * Handle login error
   */
  private handleLoginError(error: any): void {
    this.loginAttempts++;
    
    let errorMessage = this.t('invalidCredentials');
    
    if (error.status === 0) {
      errorMessage = this.t('networkError');
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showError(errorMessage);
    
    // Clear password field on error
    this.loginForm.patchValue({ password: '' });
  }

  /**
   * Handle language change
   */
  onLanguageChange(language: 'es' | 'en'): void {
    this.selectedLanguage = language;
    
    // Save language preference (only in browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('carddemo_language', language);
    }
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return this.t(`${fieldName}Required`);
    }
    
    if (field.errors['minlength']) {
      return this.t(`${fieldName}MinLength`);
    }

    return '';
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Show error notification
   */
  private showError(message: string): void {
    this.notificationService.showError(message);
  }

  /**
   * Redirect to main menu based on user role
   */
  private redirectToMainMenu(): void {
    const user = this.authService.getCurrentUserValue();
    
    if (user?.role === UserRole.ADMIN) {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Get translation for current language
   */
  t(key: string): string {
    return this.translations[this.selectedLanguage][key as keyof typeof this.translations.es] || key;
  }
}