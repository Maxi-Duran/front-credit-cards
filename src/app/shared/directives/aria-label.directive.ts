import { Directive, ElementRef, Input, OnInit, OnChanges, inject } from '@angular/core';
import { AccessibilityService } from '../../core/services/accessibility.service';

@Directive({
  selector: '[appAriaLabel]',
  standalone: true
})
export class AriaLabelDirective implements OnInit, OnChanges {
  private elementRef = inject(ElementRef);
  private a11yService = inject(AccessibilityService);

  @Input() appAriaLabel: string = '';
  @Input() ariaDescribedBy?: string;
  @Input() ariaRole?: string;

  ngOnInit(): void {
    this.updateAriaAttributes();
  }

  ngOnChanges(): void {
    this.updateAriaAttributes();
  }

  private updateAriaAttributes(): void {
    const element = this.elementRef.nativeElement;

    if (this.appAriaLabel) {
      this.a11yService.setAriaLabel(element, this.appAriaLabel);
    }

    if (this.ariaDescribedBy) {
      this.a11yService.setAriaDescribedBy(element, this.ariaDescribedBy);
    }

    if (this.ariaRole) {
      this.a11yService.setRole(element, this.ariaRole);
    }
  }
}
