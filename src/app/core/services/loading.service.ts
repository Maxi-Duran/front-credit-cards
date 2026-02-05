import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCounter = 0;

  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  show(): void {
    this.loadingCounter++;
    if (this.loadingCounter === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    if (this.loadingCounter > 0) {
      this.loadingCounter--;
    }
    
    if (this.loadingCounter === 0) {
      this.loadingSubject.next(false);
    }
  }

  reset(): void {
    this.loadingCounter = 0;
    this.loadingSubject.next(false);
  }

  // Convenience method for setting loading state
  setLoading(loading: boolean): void {
    if (loading) {
      this.show();
    } else {
      this.hide();
    }
  }
}