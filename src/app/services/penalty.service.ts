import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Penalty {
  _id: string;
  user: string;
  coffeeShop: string;
  amount: number;
  reason: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenaltyCreate {
  user: string;
  coffeeShop: string;
  amount: number;
  reason: string;
  date: string;
}

export interface PenaltiesListResponse {
  penalties: Penalty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class PenaltyService {
  private apiUrl = `${environment.apiUrl}/penalties`;

  constructor(private http: HttpClient) {}

  /**
   * Получить список штрафов с фильтрацией и пагинацией (Admin/Manager)
   */
  getPenalties(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    coffeeShopId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<PenaltiesListResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.userId) {
      httpParams = httpParams.set('userId', params.userId);
    }
    if (params?.coffeeShopId) {
      httpParams = httpParams.set('coffeeShopId', params.coffeeShopId);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    return this.http.get<PenaltiesListResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Создать новый штраф (Admin/Manager)
   */
  createPenalty(penaltyData: PenaltyCreate): Observable<Penalty> {
    return this.http.post<Penalty>(this.apiUrl, penaltyData);
  }

  /**
   * Удалить штраф (Admin/Manager)
   * Менеджер может удалить только штраф своей кофейни
   */
  deletePenalty(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}