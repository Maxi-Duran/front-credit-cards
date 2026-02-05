import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);

  get notifications$(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  success(title: string, message: string, duration = 5000): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(title: string, message: string, actions?: NotificationAction[]): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      actions
    });
  }

  warning(title: string, message: string, duration = 7000): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(title: string, message: string, duration = 5000): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }

  // Convenience methods for simple messages
  showSuccess(message: string, duration = 5000): void {
    this.success('Success', message, duration);
  }

  showError(message: string, actions?: NotificationAction[]): void {
    this.error('Error', message, actions);
  }

  showWarning(message: string, options?: { duration?: number; action?: string }): void {
    const actions = options?.action ? [{ label: options.action, action: () => {} }] : undefined;
    this.warning('Warning', message, options?.duration || 7000);
  }

  showInfo(message: string, duration = 5000): void {
    this.info('Info', message, duration);
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const id = this.generateId();
    const fullNotification: Notification = { ...notification, id };
    
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, fullNotification]);

    if (notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}