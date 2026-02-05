import { Directive, ElementRef, OnInit, inject, Input } from '@angular/core';
import { AccessibilityService } from '../../core/services/accessibility.service';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements OnInit {
  private elementRef = inject(ElementRef);
  private a11yService = inject(AccessibilityService);

  @Input() appAutoFocus: boolean = true;
  @Input() focusDelay: number = 0;

  ngOnInit(): void {
    if (this.appAutoFocus) {
      setTimeout(() => {
        this.a11yService.setFocus(this.elementRef.nativeElement);
      }, this.focusDelay);
    }
  }
}
