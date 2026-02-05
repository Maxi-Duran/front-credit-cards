import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export interface FocusTrapConfig {
  element: HTMLElement;
  initialFocus?: HTMLElement;
  returnFocus?: HTMLElement;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private document = inject(DOCUMENT);
  private destroy$ = new Subject<void>();
  private focusTrapStack: FocusTrapConfig[] = [];

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = this.getOrCreateAnnouncer(priority);
    
    // Clear previous message
    announcer.textContent = '';
    
    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }

  /**
   * Set focus to an element
   */
  setFocus(element: HTMLElement | null, options?: FocusOptions): void {
    if (!element) {
      return;
    }

    // Ensure element is focusable
    if (!element.hasAttribute('tabindex') && !this.isNaturallyFocusable(element)) {
      element.setAttribute('tabindex', '-1');
    }

    setTimeout(() => {
      element.focus(options);
    }, 0);
  }

  /**
   * Trap focus within a container (useful for modals/dialogs)
   */
  trapFocus(config: FocusTrapConfig): void {
    this.focusTrapStack.push(config);

    // Set initial focus
    if (config.initialFocus) {
      this.setFocus(config.initialFocus);
    } else {
      const firstFocusable = this.getFirstFocusableElement(config.element);
      this.setFocus(firstFocusable);
    }

    // Listen for Tab key
    fromEvent<KeyboardEvent>(config.element, 'keydown')
      .pipe(
        filter(event => event.key === 'Tab'),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.handleFocusTrap(event, config.element);
      });
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(): void {
    const config = this.focusTrapStack.pop();
    
    if (config?.returnFocus) {
      this.setFocus(config.returnFocus);
    }
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
      .filter(element => this.isVisible(element));
  }

  /**
   * Get the first focusable element in a container
   */
  getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[0] || null;
  }

  /**
   * Get the last focusable element in a container
   */
  getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
  }

  /**
   * Check if an element is visible
   */
  isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  /**
   * Add ARIA label to an element
   */
  setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  /**
   * Add ARIA described by to an element
   */
  setAriaDescribedBy(element: HTMLElement, describedById: string): void {
    element.setAttribute('aria-describedby', describedById);
  }

  /**
   * Set ARIA live region
   */
  setAriaLive(element: HTMLElement, value: 'off' | 'polite' | 'assertive'): void {
    element.setAttribute('aria-live', value);
  }

  /**
   * Set ARIA expanded state
   */
  setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', String(expanded));
  }

  /**
   * Set ARIA selected state
   */
  setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', String(selected));
  }

  /**
   * Set ARIA disabled state
   */
  setAriaDisabled(element: HTMLElement, disabled: boolean): void {
    element.setAttribute('aria-disabled', String(disabled));
  }

  /**
   * Set ARIA hidden state
   */
  setAriaHidden(element: HTMLElement, hidden: boolean): void {
    element.setAttribute('aria-hidden', String(hidden));
  }

  /**
   * Set ARIA role
   */
  setRole(element: HTMLElement, role: string): void {
    element.setAttribute('role', role);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getOrCreateAnnouncer(priority: 'polite' | 'assertive'): HTMLElement {
    const id = `a11y-announcer-${priority}`;
    let announcer = this.document.getElementById(id);

    if (!announcer) {
      announcer = this.document.createElement('div');
      announcer.id = id;
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      this.document.body.appendChild(announcer);
    }

    return announcer;
  }

  private isNaturallyFocusable(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
  }

  private handleFocusTrap(event: KeyboardEvent, container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = this.document.activeElement as HTMLElement;

    // Shift + Tab on first element -> focus last element
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
    // Tab on last element -> focus first element
    else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}
