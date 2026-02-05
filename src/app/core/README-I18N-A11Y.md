# Internationalization (i18n) and Accessibility (a11y) Guide

## Overview

This document provides comprehensive guidance on using the internationalization and accessibility features implemented in the CardDemo Angular application.

## Internationalization (i18n)

### I18nService

The `I18nService` provides centralized language management with support for Spanish (es) and English (en).

#### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { I18nService } from './core/services/i18n.service';

@Component({
  selector: 'app-example',
  template: `
    <h1>{{ i18nService.translate('common.welcome') }}</h1>
    <p>{{ i18nService.translate('validation.required') }}</p>
  `
})
export class ExampleComponent {
  i18nService = inject(I18nService);
}
```

#### Translation with Parameters

```typescript
// In component
const message = this.i18nService.translate('validation.minLength', { min: 5 });
// Output (ES): "Longitud mínima: 5 caracteres"
// Output (EN): "Minimum length: 5 characters"
```

#### Language Switching

```typescript
// Set language
this.i18nService.setLanguage('en');

// Toggle between languages
this.i18nService.toggleLanguage();

// Get current language
const currentLang = this.i18nService.getLanguage();
```

#### Locale-Specific Formatting

```typescript
// Format date
const formattedDate = this.i18nService.formatDate(new Date(), 'medium');

// Format number
const formattedNumber = this.i18nService.formatNumber(1234.56, 2);

// Format currency
const formattedCurrency = this.i18nService.formatCurrency(1234.56, 'USD');
```

### Translation Pipe

Use the `translate` pipe in templates for automatic translation:

```html
<!-- Basic translation -->
<h1>{{ 'common.welcome' | translate }}</h1>

<!-- Translation with parameters -->
<p>{{ 'validation.minLength' | translate:{ min: 5 } }}</p>

<!-- In form labels -->
<mat-label>{{ 'auth.username' | translate }}</mat-label>
```

### Locale Formatting Pipes

```html
<!-- Date formatting -->
<p>{{ transaction.date | localeDate:'medium' }}</p>

<!-- Number formatting -->
<p>{{ account.balance | localeNumber:2 }}</p>

<!-- Currency formatting -->
<p>{{ payment.amount | localeCurrency:'USD' }}</p>
```

### Language Switcher Component

Add the language switcher to your layout:

```html
<app-language-switcher></app-language-switcher>
```

### Language Persistence

Language preferences are automatically persisted in:
- **localStorage**: For long-term persistence across sessions
- **sessionStorage**: For session-based persistence

The service automatically loads the saved preference on initialization.

### Adding New Translations

To add new translation keys, update the `getSpanishTranslations()` and `getEnglishTranslations()` methods in `i18n.service.ts`:

```typescript
private getSpanishTranslations(): TranslationKeys {
  return {
    // ... existing translations
    myFeature: {
      title: 'Mi Característica',
      description: 'Descripción de mi característica'
    }
  };
}

private getEnglishTranslations(): TranslationKeys {
  return {
    // ... existing translations
    myFeature: {
      title: 'My Feature',
      description: 'My feature description'
    }
  };
}
```

## Accessibility (a11y)

### AccessibilityService

The `AccessibilityService` provides comprehensive accessibility features including screen reader support, focus management, and ARIA attributes.

#### Screen Reader Announcements

```typescript
import { AccessibilityService } from './core/services/accessibility.service';

@Component({...})
export class ExampleComponent {
  a11yService = inject(AccessibilityService);

  saveData() {
    // ... save logic
    this.a11yService.announce('Data saved successfully', 'polite');
  }

  showError() {
    // ... error logic
    this.a11yService.announce('Error: Please check your input', 'assertive');
  }
}
```

#### Focus Management

```typescript
// Set focus to an element
this.a11yService.setFocus(elementRef.nativeElement);

// Get focusable elements in a container
const focusableElements = this.a11yService.getFocusableElements(containerElement);

// Get first/last focusable element
const firstElement = this.a11yService.getFirstFocusableElement(containerElement);
const lastElement = this.a11yService.getLastFocusableElement(containerElement);
```

#### Focus Trap (for Modals/Dialogs)

```typescript
// Trap focus within a modal
this.a11yService.trapFocus({
  element: modalElement,
  initialFocus: firstInputElement,
  returnFocus: triggerButtonElement
});

// Release focus trap when modal closes
this.a11yService.releaseFocusTrap();
```

#### ARIA Attributes

```typescript
// Set ARIA label
this.a11yService.setAriaLabel(element, 'Close dialog');

// Set ARIA described by
this.a11yService.setAriaDescribedBy(element, 'error-message-id');

// Set ARIA expanded
this.a11yService.setAriaExpanded(element, true);

// Set ARIA selected
this.a11yService.setAriaSelected(element, true);

// Set ARIA role
this.a11yService.setRole(element, 'dialog');
```

### Accessibility Directives

#### Focus Trap Directive

Automatically trap focus within a container:

```html
<div appFocusTrap class="modal">
  <!-- Modal content -->
  <button>Close</button>
</div>
```

#### Auto Focus Directive

Automatically focus an element when it appears:

```html
<!-- Focus immediately -->
<input appAutoFocus type="text" />

<!-- Focus with delay -->
<input [appAutoFocus]="true" [focusDelay]="300" type="text" />
```

#### Keyboard Navigation Directive

Enable arrow key navigation within a container:

```html
<!-- Horizontal navigation -->
<div appKeyboardNav navDirection="horizontal">
  <button>Option 1</button>
  <button>Option 2</button>
  <button>Option 3</button>
</div>

<!-- Vertical navigation -->
<div appKeyboardNav navDirection="vertical">
  <a href="#">Link 1</a>
  <a href="#">Link 2</a>
  <a href="#">Link 3</a>
</div>

<!-- Both directions -->
<div appKeyboardNav navDirection="both">
  <!-- Grid of focusable elements -->
</div>
```

Supported keys:
- **Arrow keys**: Navigate between elements
- **Home**: Focus first element
- **End**: Focus last element

#### ARIA Label Directive

Add ARIA attributes declaratively:

```html
<button 
  appAriaLabel="Close dialog"
  ariaDescribedBy="dialog-description"
  ariaRole="button">
  <mat-icon>close</mat-icon>
</button>
```

### Skip Navigation Component

Add skip navigation for screen readers:

```html
<!-- In app.component.html -->
<app-skip-nav></app-skip-nav>

<!-- Main content should have id="main-content" -->
<main id="main-content">
  <!-- Your content -->
</main>
```

### Accessibility Best Practices

#### 1. Always Provide Text Alternatives

```html
<!-- Images -->
<img src="logo.png" alt="CardDemo Logo" />

<!-- Icon buttons -->
<button mat-icon-button aria-label="Delete account">
  <mat-icon>delete</mat-icon>
</button>
```

#### 2. Use Semantic HTML

```html
<!-- Good -->
<nav>
  <ul>
    <li><a href="/accounts">Accounts</a></li>
  </ul>
</nav>

<!-- Avoid -->
<div class="nav">
  <div class="link">Accounts</div>
</div>
```

#### 3. Ensure Keyboard Navigation

```html
<!-- All interactive elements should be keyboard accessible -->
<button (click)="save()" (keydown.enter)="save()">Save</button>
```

#### 4. Provide Form Labels

```html
<!-- Always associate labels with inputs -->
<mat-form-field>
  <mat-label>{{ 'auth.username' | translate }}</mat-label>
  <input matInput formControlName="username" />
</mat-form-field>
```

#### 5. Use ARIA Live Regions for Dynamic Content

```html
<div aria-live="polite" aria-atomic="true">
  {{ statusMessage }}
</div>
```

#### 6. Ensure Sufficient Color Contrast

Use Material Design's color system which ensures WCAG AA compliance:

```scss
// Use theme colors
.primary-text {
  color: mat.get-color-from-palette($primary, 500);
}
```

#### 7. Make Focus Visible

```scss
// Ensure focus indicators are visible
button:focus {
  outline: 2px solid mat.get-color-from-palette($primary, 500);
  outline-offset: 2px;
}
```

## Complete Example

Here's a complete example showing i18n and a11y integration:

```typescript
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from './core/services/i18n.service';
import { AccessibilityService } from './core/services/accessibility.service';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { LocaleCurrencyPipe } from './shared/pipes/locale-currency.pipe';
import { SharedModule } from './shared/shared.module';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, TranslatePipe, LocaleCurrencyPipe],
  template: `
    <app-skip-nav></app-skip-nav>
    
    <main id="main-content">
      <h1>{{ 'payment.title' | translate }}</h1>
      
      <app-language-switcher></app-language-switcher>
      
      <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" appKeyboardNav>
        <mat-form-field>
          <mat-label>{{ 'payment.paymentAmount' | translate }}</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="amount"
            appAutoFocus
            [attr.aria-label]="i18nService.translate('payment.paymentAmount')"
            [attr.aria-describedby]="paymentForm.get('amount')?.invalid ? 'amount-error' : null" />
          <mat-error id="amount-error">
            {{ 'validation.required' | translate }}
          </mat-error>
        </mat-form-field>
        
        <p>
          {{ 'payment.currentBalance' | translate }}: 
          {{ currentBalance | localeCurrency:'USD' }}
        </p>
        
        <button 
          mat-raised-button 
          color="primary" 
          type="submit"
          [disabled]="paymentForm.invalid"
          [attr.aria-label]="i18nService.translate('payment.makePayment')">
          {{ 'payment.makePayment' | translate }}
        </button>
      </form>
      
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        class="sr-only">
        {{ statusMessage }}
      </div>
    </main>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
  `]
})
export class PaymentFormComponent {
  i18nService = inject(I18nService);
  a11yService = inject(AccessibilityService);
  fb = inject(FormBuilder);
  
  paymentForm: FormGroup;
  currentBalance = 1234.56;
  statusMessage = '';
  
  constructor() {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });
  }
  
  onSubmit(): void {
    if (this.paymentForm.valid) {
      const amount = this.paymentForm.get('amount')?.value;
      
      // Announce to screen readers
      this.a11yService.announce(
        this.i18nService.translate('payment.success'),
        'polite'
      );
      
      // Update status message
      this.statusMessage = this.i18nService.translate('payment.success');
    }
  }
}
```

## Testing i18n and a11y

### Testing Translations

```typescript
describe('I18nService', () => {
  let service: I18nService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });
  
  it('should translate keys correctly', () => {
    service.setLanguage('en');
    expect(service.translate('common.save')).toBe('Save');
    
    service.setLanguage('es');
    expect(service.translate('common.save')).toBe('Guardar');
  });
  
  it('should handle parameters in translations', () => {
    service.setLanguage('en');
    const result = service.translate('validation.minLength', { min: 5 });
    expect(result).toBe('Minimum length: 5 characters');
  });
});
```

### Testing Accessibility

```typescript
describe('AccessibilityService', () => {
  let service: AccessibilityService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessibilityService);
  });
  
  it('should set ARIA label', () => {
    const element = document.createElement('button');
    service.setAriaLabel(element, 'Close dialog');
    expect(element.getAttribute('aria-label')).toBe('Close dialog');
  });
  
  it('should get focusable elements', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>Button 1</button>
      <a href="#">Link</a>
      <button disabled>Disabled</button>
    `;
    
    const focusable = service.getFocusableElements(container);
    expect(focusable.length).toBe(2); // Only enabled elements
  });
});
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Material Accessibility](https://material.angular.io/cdk/a11y/overview)
- [MDN ARIA Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM Resources](https://webaim.org/resources/)
