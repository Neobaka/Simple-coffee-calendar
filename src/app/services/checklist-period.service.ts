import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChecklistPeriod {
  dateFrom: string;
  dateTo: string;
}

@Injectable({ providedIn: 'root' })
export class ChecklistPeriodService {
  private readonly period$ = new BehaviorSubject<ChecklistPeriod>(this.getDefaultPeriod());

  getPeriod(): ChecklistPeriod {
    return this.period$.getValue();
  }

  get periodChanges(): Observable<ChecklistPeriod> {
    return this.period$.asObservable();
  }

  setPeriod(dateFrom: string, dateTo: string): void {
    this.period$.next({ dateFrom, dateTo });
  }

  private getDefaultPeriod(): ChecklistPeriod {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      dateFrom: this.formatDateForInput(firstDay),
      dateTo: this.formatDateForInput(today),
    };
  }

  formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
