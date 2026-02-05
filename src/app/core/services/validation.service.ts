import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'custom';
  value?: any;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  type: string;
  message: string;
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  /**
   * Validate a single field value against rules
   */
  validateField(field: string, value: any, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const error = this.validateRule(field, value, rule);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get user-friendly error message for validation errors
   */
  getErrorMessage(error: ValidationErrors, fieldName: string, language: 'es' | 'en' = 'es'): string {
    const messages = this.getErrorMessages(language);
    
    if (error['required']) {
      return messages.required.replace('{field}', fieldName);
    }
    
    if (error['minlength']) {
      return messages.minLength
        .replace('{field}', fieldName)
        .replace('{min}', error['minlength'].requiredLength);
    }
    
    if (error['maxlength']) {
      return messages.maxLength
        .replace('{field}', fieldName)
        .replace('{max}', error['maxlength'].requiredLength);
    }
    
    if (error['min']) {
      return messages.min
        .replace('{field}', fieldName)
        .replace('{min}', error['min'].min);
    }
    
    if (error['max']) {
      return messages.max
        .replace('{field}', fieldName)
        .replace('{max}', error['max'].max);
    }
    
    if (error['pattern']) {
      return messages.pattern.replace('{field}', fieldName);
    }
    
    if (error['email']) {
      return messages.email.replace('{field}', fieldName);
    }

    // Custom error messages
    if (error['customError']) {
      return error['customError'];
    }

    return messages.invalid.replace('{field}', fieldName);
  }

  /**
   * Custom validators
   */
  
  /**
   * Validator for customer ID format
   */
  customerIdValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const customerIdPattern = /^[A-Z0-9]{6,12}$/;
      if (!customerIdPattern.test(control.value)) {
        return { 
          customerIdFormat: { 
            value: control.value,
            message: 'El ID del cliente debe tener entre 6 y 12 caracteres alfanuméricos en mayúsculas'
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for account number format
   */
  accountNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const accountNumberPattern = /^\d{10,16}$/;
      if (!accountNumberPattern.test(control.value)) {
        return { 
          accountNumberFormat: { 
            value: control.value,
            message: 'El número de cuenta debe tener entre 10 y 16 dígitos'
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for currency amounts
   */
  currencyValidator(min: number = 0, max: number = 999999999): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) return null;
      
      const value = parseFloat(control.value);
      
      if (isNaN(value)) {
        return { 
          currency: { 
            value: control.value,
            message: 'Debe ser un valor numérico válido'
          }
        };
      }
      
      if (value < min) {
        return { 
          currencyMin: { 
            value: control.value,
            min,
            message: `El valor debe ser mayor o igual a ${min}`
          }
        };
      }
      
      if (value > max) {
        return { 
          currencyMax: { 
            value: control.value,
            max,
            message: `El valor no puede exceder ${max}`
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for percentage values
   */
  percentageValidator(min: number = 0, max: number = 100): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) return null;
      
      const value = parseFloat(control.value);
      
      if (isNaN(value)) {
        return { 
          percentage: { 
            value: control.value,
            message: 'Debe ser un porcentaje válido'
          }
        };
      }
      
      if (value < min || value > max) {
        return { 
          percentageRange: { 
            value: control.value,
            min,
            max,
            message: `El porcentaje debe estar entre ${min}% y ${max}%`
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for date range - ensures start date is before end date
   */
  dateRangeValidator(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as any;
      const startDate = group.get(startDateField)?.value;
      const endDate = group.get(endDateField)?.value;

      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return {
          dateRange: {
            message: 'La fecha de inicio debe ser anterior a la fecha de fin'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator for card number (Luhn algorithm)
   */
  cardNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const cardNumber = control.value.replace(/\s/g, '');
      
      if (!/^\d{13,19}$/.test(cardNumber)) {
        return {
          cardNumber: {
            value: control.value,
            message: 'El número de tarjeta debe tener entre 13 y 19 dígitos'
          }
        };
      }

      // Luhn algorithm validation
      if (!this.luhnCheck(cardNumber)) {
        return {
          cardNumberInvalid: {
            value: control.value,
            message: 'El número de tarjeta no es válido'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator for phone number
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const phonePattern = /^[\d\s\-\+\(\)]{10,20}$/;
      if (!phonePattern.test(control.value)) {
        return {
          phone: {
            value: control.value,
            message: 'El número de teléfono no es válido'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator for postal code
   */
  postalCodeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const postalCodePattern = /^\d{5}(-\d{4})?$/;
      if (!postalCodePattern.test(control.value)) {
        return {
          postalCode: {
            value: control.value,
            message: 'El código postal debe tener 5 dígitos'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator to match two fields (e.g., password confirmation)
   */
  matchFieldValidator(fieldToMatch: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;

      const fieldToMatchControl = control.parent.get(fieldToMatch);
      if (!fieldToMatchControl) return null;

      if (control.value !== fieldToMatchControl.value) {
        return {
          fieldMatch: {
            message: 'Los campos no coinciden'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator for future date
   */
  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate <= today) {
        return {
          futureDate: {
            message: 'La fecha debe ser futura'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator for past date
   */
  pastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate >= today) {
        return {
          pastDate: {
            message: 'La fecha debe ser pasada'
          }
        };
      }

      return null;
    };
  }

  /**
   * Luhn algorithm for credit card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Conditional validator - field is required if condition is met
   */
  conditionalValidator(condition: () => boolean, validators: ValidatorFn[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!condition()) {
        return null;
      }
      
      for (const validator of validators) {
        const error = validator(control);
        if (error) {
          return error;
        }
      }
      
      return null;
    };
  }

  private validateRule(field: string, value: any, rule: ValidationRule): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return {
            field,
            type: 'required',
            message: rule.message || `${field} es requerido`
          };
        }
        break;
        
      case 'minLength':
        if (value && value.length < rule.value) {
          return {
            field,
            type: 'minLength',
            message: rule.message || `${field} debe tener al menos ${rule.value} caracteres`,
            value: rule.value
          };
        }
        break;
        
      case 'maxLength':
        if (value && value.length > rule.value) {
          return {
            field,
            type: 'maxLength',
            message: rule.message || `${field} no puede exceder ${rule.value} caracteres`,
            value: rule.value
          };
        }
        break;
        
      case 'pattern':
        if (value && !rule.value.test(value)) {
          return {
            field,
            type: 'pattern',
            message: rule.message || `${field} tiene un formato inválido`
          };
        }
        break;
        
      case 'min':
        if (value !== null && value !== undefined && value < rule.value) {
          return {
            field,
            type: 'min',
            message: rule.message || `${field} debe ser mayor o igual a ${rule.value}`,
            value: rule.value
          };
        }
        break;
        
      case 'max':
        if (value !== null && value !== undefined && value > rule.value) {
          return {
            field,
            type: 'max',
            message: rule.message || `${field} no puede exceder ${rule.value}`,
            value: rule.value
          };
        }
        break;
        
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailPattern.test(value)) {
          return {
            field,
            type: 'email',
            message: rule.message || `${field} debe ser un email válido`
          };
        }
        break;
    }
    
    return null;
  }

  private getErrorMessages(language: 'es' | 'en') {
    const messages = {
      es: {
        required: '{field} es requerido',
        minLength: '{field} debe tener al menos {min} caracteres',
        maxLength: '{field} no puede exceder {max} caracteres',
        min: '{field} debe ser mayor o igual a {min}',
        max: '{field} no puede exceder {max}',
        pattern: '{field} tiene un formato inválido',
        email: '{field} debe ser un email válido',
        invalid: '{field} es inválido'
      },
      en: {
        required: '{field} is required',
        minLength: '{field} must be at least {min} characters',
        maxLength: '{field} cannot exceed {max} characters',
        min: '{field} must be greater than or equal to {min}',
        max: '{field} cannot exceed {max}',
        pattern: '{field} has an invalid format',
        email: '{field} must be a valid email',
        invalid: '{field} is invalid'
      }
    };
    
    return messages[language];
  }
}