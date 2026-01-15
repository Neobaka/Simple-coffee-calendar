import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Shift {
  _id: string;
  user: string;
  coffeeShop: string;
  date: string;
  type: 'work' | 'sick_leave' | 'vacation';
  startTime?: string;
  endTime?: string;
  hourlyRate: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftCreate {
  user: string;
  coffeeShop: string;
  date: string;
  type: 'work' | 'sick_leave' | 'vacation';
  startTime?: string;
  endTime?: string;
  hourlyRate: number;
}

export interface ShiftUpdate {
  user?: string;
  coffeeShop?: string;
  date?: string;
  type?: 'work' | 'sick_leave' | 'vacation';
  startTime?: string;
  endTime?: string;
  hourlyRate?: number;
}

export interface ShiftsListResponse {
  shifts: Shift[];
  total: number;
}

export interface PublishShiftsRequest {
  date: string;
}

export interface PublishShiftsResponse {
  message: string;
  publishedCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = `${environment.apiUrl}/shifts`;

  constructor(private http: HttpClient) {}

  /**
   * Получить список смен с фильтрацией
   */
  getShifts(params?: {
    coffeeShop?: string;
    user?: string;
    dateFrom?: string;
    isPublished?: boolean;
  }): Observable<ShiftsListResponse> {
    let httpParams = new HttpParams();
    
    if (params?.coffeeShop) {
      httpParams = httpParams.set('coffeeShop', params.coffeeShop);
    }
    if (params?.user) {
      httpParams = httpParams.set('user', params.user);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.isPublished !== undefined) {
      httpParams = httpParams.set('isPublished', params.isPublished.toString());
    }

    return this.http.get<ShiftsListResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Создать смену (Admin, Manager)
   */
  createShift(shiftData: ShiftCreate): Observable<Shift> {
    return this.http.post<Shift>(this.apiUrl, shiftData);
  }

  /**
   * Получить смену по ID
   */
  getShiftById(id: string): Observable<Shift> {
    return this.http.get<Shift>(`${this.apiUrl}/${id}`);
  }

  /**
   * Обновить смену (Admin, Manager)
   */
  updateShift(id: string, shiftData: ShiftUpdate): Observable<Shift> {
    return this.http.put<Shift>(`${this.apiUrl}/${id}`, shiftData);
  }

  /**
   * Удалить смену (Admin, Manager)
   */
  deleteShift(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Опубликовать смены на определенную дату (Admin, Manager)
   */
  publishShiftsByDate(date: string): Observable<PublishShiftsResponse> {
    return this.http.post<PublishShiftsResponse>(
      `${this.apiUrl}/publish/date`,
      { date }
    );
  }
}