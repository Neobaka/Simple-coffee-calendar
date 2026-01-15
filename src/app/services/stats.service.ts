import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  totalHours: number;
  totalSalary: number;
  totalPenalties: number;
  netSalary: number;
  shiftsCount: number;
  baristas: Array<{
    userId: string;
    fullName: string;
    hours: number;
    salary: number;
    penalties: number;
    netSalary: number;
  }>;
}

export interface UserSummary {
  userId: string;
  fullName: string;
  totalHours: number;
  totalSalary: number;
  totalPenalties: number;
  netSalary: number;
  shiftsCount: number;
  shifts: Array<{
    date: string;
    type: string;
    hours: number;
    salary: number;
  }>;
  penalties: Array<{
    date: string;
    amount: number;
    reason: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  /**
   * Получить сводку для дашборда кофейни (Admin/Manager)
   * Менеджер видит только свою кофейню
   */
  getDashboardSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
    coffeeShopId?: string;
  }): Observable<DashboardSummary> {
    let httpParams = new HttpParams();
    
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }
    if (params?.coffeeShopId) {
      httpParams = httpParams.set('coffeeShopId', params.coffeeShopId);
    }

    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard-summary`, { params: httpParams });
  }

  /**
   * Экспорт сводки дашборда в Excel (Admin/Manager)
   */
  exportDashboardSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
    coffeeShopId?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }
    if (params?.coffeeShopId) {
      httpParams = httpParams.set('coffeeShopId', params.coffeeShopId);
    }

    return this.http.get(`${this.apiUrl}/dashboard-summary/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  /**
   * Получить статистику по конкретному пользователю (Admin/Manager/Barista)
   * Barista может запрашивать только СВОЮ статистику
   */
  getUserSummary(userId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Observable<UserSummary> {
    let httpParams = new HttpParams();
    
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    return this.http.get<UserSummary>(`${this.apiUrl}/user-summary/${userId}`, { params: httpParams });
  }

  /**
   * Экспорт статистики пользователя в Excel (Admin/Manager/Barista)
   */
  exportUserSummary(userId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    return this.http.get(`${this.apiUrl}/user-summary/${userId}/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  /**
   * Вспомогательный метод для скачивания файла
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}