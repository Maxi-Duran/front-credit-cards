import { Injectable } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormHelperService {

  /**
   * Mark all fields in a form as touched to trigger validation display
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Mark all fields in a form as dirty
   */
  markFormGroupDirty(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsDirty();

      if (control instanceof FormGroup) {
        this.markFormGroupDirty(control);
      }
    });
  }

  /**
   * Reset form to pristine and untouched state
   */
  resetForm(formGroup: FormGroup): void {
    formGroup.reset();
    this.markFormGroupUntouched(formGroup);
    this.markFormGroupPristine(formGroup);
  }

  /**
   * Mark all fields as untouched
   */
  markFormGroupUntouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsUntouched();

      if (control instanceof FormGroup) {
        this.markFormGroupUntouched(control);
      }
    });
  }

  /**
   * Mark all fields as pristine
   */
  markFormGroupPristine(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsPristine();

      if (control instanceof FormGroup) {
        this.markFormGroupPristine(control);
      }
    });
  }

  /**
   * Get all validation errors from a form
   */
  getFormValidationErrors(formGroup: FormGroup): Array<{ field: string; errors: any }> {
    const errors: Array<{ field: string; errors: any }> = [];

    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup) {
        const nestedErrors = this.getFormValidationErrors(control);
        errors.push(...nestedErrors.map(e => ({ ...e, field: `${key}.${e.field}` })));
      } else if (control?.errors) {
        errors.push({ field: key, errors: control.errors });
      }
    });

    return errors;
  }

  /**
   * Check if form has any errors
   */
  hasErrors(formGroup: FormGroup): boolean {
    return this.getFormValidationErrors(formGroup).length > 0;
  }

  /**
   * Get first error message from form
   */
  getFirstErrorMessage(formGroup: FormGroup): string | null {
    const errors = this.getFormValidationErrors(formGroup);
    
    if (errors.length === 0) {
      return null;
    }

    const firstError = errors[0];
    const errorKey = Object.keys(firstError.errors)[0];
    const errorValue = firstError.errors[errorKey];

    if (errorValue && errorValue.message) {
      return errorValue.message;
    }

    return `${firstError.field}: ${errorKey}`;
  }

  /**
   * Disable all controls in a form
   */
  disableForm(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.disable();

      if (control instanceof FormGroup) {
        this.disableForm(control);
      }
    });
  }

  /**
   * Enable all controls in a form
   */
  enableForm(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.enable();

      if (control instanceof FormGroup) {
        this.enableForm(control);
      }
    });
  }

  /**
   * Check if a specific field has an error
   */
  hasFieldError(formGroup: FormGroup, fieldName: string, errorType?: string): boolean {
    const control = formGroup.get(fieldName);
    
    if (!control) {
      return false;
    }

    if (errorType) {
      return !!(control.errors && control.errors[errorType] && (control.dirty || control.touched));
    }

    return !!(control.errors && (control.dirty || control.touched));
  }

  /**
   * Get error message for a specific field
   */
  getFieldErrorMessage(formGroup: FormGroup, fieldName: string): string | null {
    const control = formGroup.get(fieldName);
    
    if (!control || !control.errors || (!control.dirty && !control.touched)) {
      return null;
    }

    const errorKey = Object.keys(control.errors)[0];
    const errorValue = control.errors[errorKey];

    if (errorValue && errorValue.message) {
      return errorValue.message;
    }

    return `${fieldName}: ${errorKey}`;
  }

  /**
   * Update form value and validity
   */
  updateFormValueAndValidity(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup) {
        this.updateFormValueAndValidity(control);
      } else {
        control?.updateValueAndValidity();
      }
    });

    formGroup.updateValueAndValidity();
  }

  /**
   * Compare two form values for changes
   */
  hasFormChanged(formGroup: FormGroup, originalValue: any): boolean {
    const currentValue = formGroup.value;
    return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
  }

  /**
   * Get changed fields between original and current form values
   */
  getChangedFields(formGroup: FormGroup, originalValue: any): string[] {
    const currentValue = formGroup.value;
    const changedFields: string[] = [];

    Object.keys(currentValue).forEach(key => {
      if (JSON.stringify(currentValue[key]) !== JSON.stringify(originalValue[key])) {
        changedFields.push(key);
      }
    });

    return changedFields;
  }
}
