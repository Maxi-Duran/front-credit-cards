import { Directive, Input, OnInit, OnDestroy, ElementRef, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appFormValidation]',
  standalone: true
})
export class FormValidationDirective implements OnInit, OnDestroy {
  @Input() validateOnBlur: boolean = false;
  @Input() validateOnChange: boolean = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private control: NgControl,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (!this.control || !this.control.control) {
      return;
    }

    // Subscribe to value changes
    if (this.validateOnChange) {
      this.control.control.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateValidationState();
        });
    }

    // Subscribe to status changes
    this.control.control.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateValidationState();
      });

    // Add blur event listener if needed
    if (this.validateOnBlur) {
      this.renderer.listen(this.el.nativeElement, 'blur', () => {
        this.control.control?.markAsTouched();
        this.updateValidationState();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateValidationState(): void {
    const control = this.control.control;
    if (!control) return;

    const element = this.el.nativeElement;

    // Remove existing validation classes
    this.renderer.removeClass(element, 'is-valid');
    this.renderer.removeClass(element, 'is-invalid');

    // Add appropriate class based on validation state
    if (control.invalid && (control.dirty || control.touched)) {
      this.renderer.addClass(element, 'is-invalid');
    } else if (control.valid && (control.dirty || control.touched)) {
      this.renderer.addClass(element, 'is-valid');
    }
  }
}
