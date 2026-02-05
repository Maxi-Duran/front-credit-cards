import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './field-error.component.html',
  styleUrls: ['./field-error.component.scss']
})
export class FieldErrorComponent {
  @Input() control?: AbstractControl | null;
  @Input() fieldName: string = 'Campo';
  @Input() language: 'es' | 'en' = 'es';
  @Input() showIcon: boolean = true;

  constructor(private validationService: ValidationService) {}

  get shouldShow(): boolean {
    return !!(this.control && this.control.invalid && (this.control.dirty || this.control.touched));
  }

  get errorMessage(): string {
    if (!this.control || !this.control.errors) {
      return '';
    }

    return this.validationService.getErrorMessage(this.control.errors, this.fieldName, this.language);
  }

  get errors(): ValidationErrors | null {
    return this.control?.errors || null;
  }
}
