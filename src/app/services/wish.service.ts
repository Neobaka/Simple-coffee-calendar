import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Wish {
  _id: string;
  user: string | {
    _id: string;
    fullName: string;
    email: string;
  };
  coffeeShop: string | {
    _id: string;
    name: string;
  };
  date: string;
  type: 'work' | 'sick_leave' | 'vacation' | 'day_off' | 'swap';
  startTime: string;
  endTime: string;
  comment?: string;
  swapWithUser?: string | {
    _id: string;
    fullName: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  managerComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishCreateData {
  date: string;
  type: 'work' | 'sick_leave' | 'vacation' | 'day_off' | 'swap';
  startTime?: string;
  endTime?: string;
  comment?: string;
  swapWithUser?: string;
}

export interface WishUpdateStatusData {
  status: 'approved' | 'rejected';
  managerComment?: string;
}

export interface WishesQueryParams {
  coffeeShop?: string;
  status?: 'pending' | 'approved' | 'rejected';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}

export interface WishCreate {
  date: string;
  type: 'work' | 'sick_leave' | 'vacation' | 'day_off' | 'swap';
  startTime: string;
  endTime: string;
  coffeeShop: string;  
}

export interface WishUpdate {
  date?: string;
  type?: 'available' | 'unavailable';
  startTime?: string;
  endTime?: string;
}

export interface WishesListResponse {
  wishes: Wish[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishService {
  private apiUrl = `${environment.apiUrl}/wishes`;

  constructor(private http: HttpClient) {}

  /**
   * Получить список пожеланий с фильтрацией
   */
  getWishes(params?: {
    page?: number;
    limit?: number;
    coffeeShop?: string;
    user?: string;
    dateFrom?: string;
    type?: 'available' | 'unavailable';
  }): Observable<WishesListResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.coffeeShop) {
      httpParams = httpParams.set('coffeeShop', params.coffeeShop);
    }
    if (params?.user) {
      httpParams = httpParams.set('user', params.user);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }

    return this.http.get<WishesListResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Создать пожелание (ТОЛЬКО BARISTA)
   */
  createWish(wishData: WishCreate): Observable<Wish> {
    return this.http.post<Wish>(this.apiUrl, wishData);
  }

  /**
   * Получить пожелание по ID
   */
  getWishById(id: string): Observable<Wish> {
    return this.http.get<Wish>(`${this.apiUrl}/${id}`);
  }

  /**
   * Обновить пожелание (ТОЛЬКО BARISTA, только свои)
   */
  updateWish(id: string, wishData: WishUpdate): Observable<Wish> {
    return this.http.put<Wish>(`${this.apiUrl}/${id}`, wishData);
  }

  /**
   * Удалить пожелание (ТОЛЬКО BARISTA, только свои)
   */
  deleteWish(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}