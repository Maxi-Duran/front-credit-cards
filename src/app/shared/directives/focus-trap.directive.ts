import { Directive, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { AccessibilityService } from '../../core/services/accessibility.service';

@Directive({
  selector: '[appFocusTrap]',
  standalone: true
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private a11yService = inject(AccessibilityService);

  ngOnInit(): void {
    this.a11yService.trapFocus({
      element: this.elementRef.nativeElement
    });
  }

  ngOnDestroy(): void {
    this.a11yService.releaseFocusTrap();
  }
}
