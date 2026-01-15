import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'barista' | 'manager' | 'admin';
  coffeeShop: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  password: string;
  fullName: string;
  role: 'barista' | 'manager' | 'admin';
  coffeeShop: string;
  hourlyRate: number;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  fullName?: string;
  role?: 'barista' | 'manager' | 'admin';
  coffeeShop?: string;
  hourlyRate?: number;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Получить список пользователей с фильтрацией и пагинацией (Admin)
   */
  getUsers(params?: {
    page?: number;
    limit?: number;
    coffeeShop?: string;
  }): Observable<UsersListResponse> {
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

    return this.http.get<UsersListResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Создать нового пользователя (Admin)
   */
  createUser(userData: UserCreate): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  /**
   * Получить пользователя по ID (Admin)
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Обновить пользователя (Admin)
   */
  updateUser(id: string, userData: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData);
  }

  /**
   * Деактивировать (удалить) пользователя (Admin)
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Активировать пользователя (Admin)
   */
  activateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/activate`, {});
  }
}