import { Directive, ElementRef, HostListener, inject, Input } from '@angular/core';
import { AccessibilityService } from '../../core/services/accessibility.service';

@Directive({
  selector: '[appKeyboardNav]',
  standalone: true
})
export class KeyboardNavDirective {
  private elementRef = inject(ElementRef);
  private a11yService = inject(AccessibilityService);

  @Input() navDirection: 'horizontal' | 'vertical' | 'both' = 'both';

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const element = this.elementRef.nativeElement;
    const focusableElements = this.a11yService.getFocusableElements(element);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex === -1) {
      return;
    }

    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
        if (this.navDirection === 'horizontal' || this.navDirection === 'both') {
          targetIndex = (currentIndex + 1) % focusableElements.length;
          event.preventDefault();
        }
        break;

      case 'ArrowLeft':
        if (this.navDirection === 'horizontal' || this.navDirection === 'both') {
          targetIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          event.preventDefault();
        }
        break;

      case 'ArrowDown':
        if (this.navDirection === 'vertical' || this.navDirection === 'both') {
          targetIndex = (currentIndex + 1) % focusableElements.length;
          event.preventDefault();
        }
        break;

      case 'ArrowUp':
        if (this.navDirection === 'vertical' || this.navDirection === 'both') {
          targetIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          event.preventDefault();
        }
        break;

      case 'Home':
        targetIndex = 0;
        event.preventDefault();
        break;

      case 'End':
        targetIndex = focusableElements.length - 1;
        event.preventDefault();
        break;
    }

    if (targetIndex !== currentIndex) {
      this.a11yService.setFocus(focusableElements[targetIndex]);
    }
  }
}
