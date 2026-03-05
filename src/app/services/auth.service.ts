import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id?: string;
  _id?: string; // Для совместимости с MongoDB
  email: string;
  fullName: string;
  role: 'barista' | 'manager' | 'supervisor' | 'admin';
  coffeeShop?: any;
  hourlyRate?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.checkAuth();
  }

  private checkAuth(): void {
    const token = this.getToken();
    if (token) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        },
        error: () => {
          this.clearAuth();
        }
      });
    }
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => {
        // Поддержка разных структур ответа от бэкенда
        const user = response.data?.user || response.user || response;
        this.setUser(user);
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(error => {
        console.error('Get current user error:', error);
        this.clearAuth();
        throw error;
      })
    );
  }

  login(login: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      login,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setToken(response.data.token);
          this.setRefreshToken(response.data.refreshToken);
          this.setUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      email,
      password,
      fullName: name
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setToken(response.data.token);
          this.setRefreshToken(response.data.refreshToken);
          this.setUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => {
        console.error('Register error:', error);
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        // Даже если запрос на logout провалился, очищаем локальные данные
        this.clearAuth();
        this.router.navigate(['/login']);
        return of(void 0);
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${this.apiUrl}/refresh`, { 
      refreshToken 
    }).pipe(
      map(response => {
        // Поддержка разных структур ответа
        const token = response.data?.token || response.data?.accessToken || response.accessToken || response.token;
        if (token) {
          this.setToken(token);
        }
        return { accessToken: token };
      })
    );
  }

  // Геттеры и сеттеры для токенов
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  private setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Проверки авторизации и ролей
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.getUserFromStorage();
    return !!token && !!user;
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value || this.getUserFromStorage();
  }

  hasRole(roles: string[]): boolean {
    const currentUser = this.getCurrentUserValue();
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['admin']);
  }

  isManagerOrAdmin(): boolean {
    return this.hasRole(['manager', 'supervisor', 'admin']);
  }

  isBarista(): boolean {
    return this.hasRole(['barista']);
  }
}