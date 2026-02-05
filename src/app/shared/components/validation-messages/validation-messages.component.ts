import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface ValidationMessage {
  type: string;
  message: string;
}

@Component({
  selector: 'app-validation-messages',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './validation-messages.component.html',
  styleUrls: ['./validation-messages.component.scss']
})
export class ValidationMessagesComponent {
  @Input() control?: AbstractControl | null;
  @Input() fieldName: string = 'Campo';
  @Input() customMessages: Record<string, string> = {};
  @Input() showIcon: boolean = true;
  @Input() language: 'es' | 'en' = 'es';

  get shouldShow(): boolean {
    return !!(this.control && this.control.invalid && (this.control.dirty || this.control.touched));
  }

  get validationMessages(): ValidationMessage[] {
    if (!this.control || !this.control.errors) {
      return [];
    }

    const errors = this.control.errors;
    const messages: ValidationMessage[] = [];

    for (const errorType in errors) {
      if (errors.hasOwnProperty(errorType)) {
        const message = this.getErrorMessage(errorType, errors[errorType]);
        if (message) {
          messages.push({ type: errorType, message });
        }
      }
    }

    return messages;
  }

  private getErrorMessage(errorType: string, errorValue: any): string {
    // Check for custom message first
    if (this.customMessages[errorType]) {
      return this.customMessages[errorType];
    }

    // Check if error has a message property
    if (errorValue && errorValue.message) {
      return errorValue.message;
    }

    // Default messages
    const messages = this.getDefaultMessages();
    return messages[errorType] || this.getGenericMessage(errorType, errorValue);
  }

  private getDefaultMessages(): Record<string, string> {
    const es = {
      required: `${this.fieldName} es requerido`,
      email: `${this.fieldName} debe ser un email válido`,
      minlength: `${this.fieldName} debe tener al menos {requiredLength} caracteres`,
      maxlength: `${this.fieldName} no puede exceder {requiredLength} caracteres`,
      min: `${this.fieldName} debe ser mayor o igual a {min}`,
      max: `${this.fieldName} no puede exceder {max}`,
      pattern: `${this.fieldName} tiene un formato inválido`,
      customerIdFormat: `El ID del cliente debe tener entre 6 y 12 caracteres alfanuméricos`,
      accountNumberFormat: `El número de cuenta debe tener entre 10 y 16 dígitos`,
      cardNumber: `El número de tarjeta debe tener entre 13 y 19 dígitos`,
      cardNumberInvalid: `El número de tarjeta no es válido`,
      phone: `El número de teléfono no es válido`,
      postalCode: `El código postal debe tener 5 dígitos`,
      currency: `Debe ser un valor numérico válido`,
      currencyMin: `El valor debe ser mayor o igual a {min}`,
      currencyMax: `El valor no puede exceder {max}`,
      percentage: `Debe ser un porcentaje válido`,
      percentageRange: `El porcentaje debe estar entre {min}% y {max}%`,
      dateRange: `La fecha de inicio debe ser anterior a la fecha de fin`,
      fieldMatch: `Los campos no coinciden`,
      futureDate: `La fecha debe ser futura`,
      pastDate: `La fecha debe ser pasada`
    };

    const en = {
      required: `${this.fieldName} is required`,
      email: `${this.fieldName} must be a valid email`,
      minlength: `${this.fieldName} must be at least {requiredLength} characters`,
      maxlength: `${this.fieldName} cannot exceed {requiredLength} characters`,
      min: `${this.fieldName} must be greater than or equal to {min}`,
      max: `${this.fieldName} cannot exceed {max}`,
      pattern: `${this.fieldName} has an invalid format`,
      customerIdFormat: `Customer ID must be 6-12 alphanumeric characters`,
      accountNumberFormat: `Account number must be 10-16 digits`,
      cardNumber: `Card number must be 13-19 digits`,
      cardNumberInvalid: `Card number is invalid`,
      phone: `Phone number is invalid`,
      postalCode: `Postal code must be 5 digits`,
      currency: `Must be a valid numeric value`,
      currencyMin: `Value must be greater than or equal to {min}`,
      currencyMax: `Value cannot exceed {max}`,
      percentage: `Must be a valid percentage`,
      percentageRange: `Percentage must be between {min}% and {max}%`,
      dateRange: `Start date must be before end date`,
      fieldMatch: `Fields do not match`,
      futureDate: `Date must be in the future`,
      pastDate: `Date must be in the past`
    };

    return this.language === 'es' ? es : en;
  }

  private getGenericMessage(errorType: string, errorValue: any): string {
    let message = this.language === 'es' 
      ? `${this.fieldName} es inválido` 
      : `${this.fieldName} is invalid`;

    // Replace placeholders with actual values
    if (errorValue && typeof errorValue === 'object') {
      for (const key in errorValue) {
        if (errorValue.hasOwnProperty(key)) {
          message = message.replace(`{${key}}`, errorValue[key]);
        }
      }
    }

    return message;
  }
}
