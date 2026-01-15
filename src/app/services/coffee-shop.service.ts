import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CoffeeShop {
  _id: string;
  name: string;
  address: string;
  phone: string;
  manager?: string | null;
  openTime: string;
  closeTime: string;
  timezone: string;
  maxBaristasPerShift: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoffeeShopCreate {
  name: string;
  address: string;
  phone: string;
  manager?: string | null;
  openTime?: string;
  closeTime?: string;
  timezone?: string;
  maxBaristasPerShift: number;
}

export interface CoffeeShopUpdate {
  name?: string;
  address?: string;
  phone?: string;
  manager?: string | null;
  openTime?: string;
  closeTime?: string;
  timezone?: string;
  maxBaristasPerShift?: number;
}

export interface CoffeeShopsListResponse {
  coffeeShops: CoffeeShop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Интерфейс для данных кофеен с пагинацией
export interface CoffeeShopsData {
  coffeeShops: CoffeeShop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CoffeeShopService {
  private apiUrl = `${environment.apiUrl}/coffee-shops`;

  constructor(private http: HttpClient) {}

  /**
   * Получить список кофеен с фильтрацией и пагинацией (Admin)
   */
  getCoffeeShops(params?: {
      page?: number;
      limit?: number;
    }): Observable<any> {  // Изменено с CoffeeShopsListResponse на any
      let httpParams = new HttpParams();
      
      if (params?.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params?.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }

      return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  /**
   * Создать новую кофейню (Admin)
   */
  createCoffeeShop(coffeeShopData: CoffeeShopCreate): Observable<CoffeeShop> {
    return this.http.post<CoffeeShop>(this.apiUrl, coffeeShopData);
  }

  /**
   * Получить кофейню по ID (Admin)
   */
  getCoffeeShopById(id: string): Observable<CoffeeShop> {
    return this.http.get<CoffeeShop>(`${this.apiUrl}/${id}`);
  }

  /**
   * Обновить кофейню (Admin)
   */
  updateCoffeeShop(id: string, coffeeShopData: CoffeeShopUpdate): Observable<CoffeeShop> {
    return this.http.put<CoffeeShop>(`${this.apiUrl}/${id}`, coffeeShopData);
  }

  /**
   * Деактивировать (архивировать) кофейню (Admin)
   */
  deleteCoffeeShop(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Активировать кофейню (Admin)
   */
  activateCoffeeShop(id: string): Observable<CoffeeShop> {
    return this.http.post<CoffeeShop>(`${this.apiUrl}/${id}/activate`, {});
  }
}