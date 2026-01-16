// src/app/components/overview/overview.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface CoffeeShopStats {
  _id: string;
  name: string;
  address: string;
  totalWage: number;
  hours: number;
  employees: number;
}

interface DashboardSummary {
  totalShops: number;
  totalEmployees: number;
  totalWage: number;
  totalHours: number;
  avgHoursPerEmployee: number;
  activeShiftsToday: number;
  coffeeShopStats: CoffeeShopStats[];
}

interface ApiResponse {
  success: boolean;
  data: any;
}

interface CoffeeShop {
  _id: string;
  name: string;
  address: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Данные для отображения
  totalShops = 0;
  totalEmployees = 0;
  totalWage = 0;
  totalHours = 0;
  avgHoursPerEmployee = 0;
  activeShiftsToday = 0;
  coffeeShops: CoffeeShopStats[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  // Временный флаг для разработки (установите true, чтобы использовать моковые данные)
  USE_MOCK_DATA = false;

  ngOnInit() {
    if (this.USE_MOCK_DATA) {
      this.loadMockData();
    } else {
      this.loadDashboardData();
    }
  }
  
  private loadMockData() {
    // Моковые данные для тестирования без бэкенда
    setTimeout(() => {
      this.totalShops = 5;
      this.totalEmployees = 27;
      this.totalWage = 266660;
      this.totalHours = 1000;
      this.avgHoursPerEmployee = 260;
      this.activeShiftsToday = 10;
      this.coffeeShops = [
        {
          _id: '1',
          name: 'Simple Coffee Академ',
          address: 'Ленина, 15',
          totalWage: 29100,
          hours: 64,
          employees: 5
        },
        {
          _id: '2',
          name: 'Simple Coffee Южная',
          address: 'Комсомольская, 77',
          totalWage: 25800,
          hours: 78,
          employees: 3
        },
        {
          _id: '3',
          name: 'Simple Coffee Чехова',
          address: 'Сирябкина, 32',
          totalWage: 36400,
          hours: 97,
          employees: 6
        }
      ];
      this.isLoading = false;
    }, 500);
  }

  private loadDashboardData() {
  const token = localStorage.getItem('auth_token');
  
  console.log('Token found:', token ? 'Yes' : 'No');
  
  if (!token) {
    console.warn('No token found, redirecting to login');
    this.router.navigate(['/login']);
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Даты для запроса (последние 30 дней)
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 30);

  const dateFromStr = dateFrom.toISOString().split('T')[0];
  const dateToStr = dateTo.toISOString().split('T')[0];

  console.log('Loading coffee shops and their stats...');

  // Сначала получаем список всех кофеен
  this.http.get<ApiResponse>('/api/coffee-shops', { headers }).subscribe({
    next: (response) => {
      console.log('Coffee shops response:', response);
      console.log('Response type:', typeof response);
      console.log('Response.data:', response.data);
      console.log('Response.data type:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      
      if (response && response.success) {
        let coffeeShopsList: CoffeeShop[];
        
        // Проверяем разные варианты структуры ответа
        if (Array.isArray(response.data)) {
          coffeeShopsList = response.data;
        } else if (response.data && Array.isArray(response.data.coffeeShops)) {
          coffeeShopsList = response.data.coffeeShops;
        } else if (response.data && Array.isArray(response.data.data)) {
          coffeeShopsList = response.data.data;
        } else {
          console.error('Unexpected data structure:', response.data);
          this.error = 'Неверный формат данных кофеен';
          this.isLoading = false;
          return;
        }
        
        console.log('Coffee shops list:', coffeeShopsList);
        console.log('Coffee shops count:', coffeeShopsList.length);
        
        this.totalShops = coffeeShopsList.length;
        
        if (coffeeShopsList.length === 0) {
          console.warn('No coffee shops found');
          this.isLoading = false;
          this.error = 'Кофейни не найдены';
          return;
        }

        // Создаем запросы статистики для каждой кофейни
        const statsRequests = coffeeShopsList.map(shop => {
          console.log('Loading stats for shop:', shop.name, shop._id);
          
          return this.http.get<ApiResponse>(
            `/api/stats/dashboard-summary?dateFrom=${dateFromStr}&dateTo=${dateToStr}&coffeeShopId=${shop._id}`,
            { headers }
          ).pipe(
            map(statsResponse => {
              console.log(`Stats for ${shop.name}:`, statsResponse);
              
              if (statsResponse && statsResponse.success && statsResponse.data) {
                const stats = statsResponse.data;
                return {
                  _id: shop._id,
                  name: shop.name,
                  address: shop.address,
                  totalWage: stats.totalPayroll || 0,
                  hours: stats.totalShiftHours || 0,
                  employees: stats.activeBaristasCount || 0
                };
              }
              // Возвращаем данные с нулями если статистики нет
              return {
                _id: shop._id,
                name: shop.name,
                address: shop.address,
                totalWage: 0,
                hours: 0,
                employees: 0
              };
            })
          );
        });

        console.log('Stats requests created:', statsRequests.length);

        // Выполняем все запросы параллельно
        forkJoin(statsRequests).subscribe({
          next: (coffeeShopsWithStats) => {
            console.log('All coffee shops with stats:', coffeeShopsWithStats);
            
            this.coffeeShops = coffeeShopsWithStats;
            
            // Вычисляем общую статистику
            this.totalEmployees = coffeeShopsWithStats.reduce((sum, shop) => sum + shop.employees, 0);
            this.totalWage = coffeeShopsWithStats.reduce((sum, shop) => sum + shop.totalWage, 0);
            this.totalHours = coffeeShopsWithStats.reduce((sum, shop) => sum + shop.hours, 0);
            this.avgHoursPerEmployee = this.totalEmployees > 0 
              ? Math.round(this.totalHours / this.totalEmployees) 
              : 0;
            
            console.log('Total stats:', {
              totalShops: this.totalShops,
              totalEmployees: this.totalEmployees,
              totalWage: this.totalWage,
              totalHours: this.totalHours,
              avgHoursPerEmployee: this.avgHoursPerEmployee
            });
            
            // Для activeShiftsToday делаем отдельный запрос без coffeeShopId
            this.loadActiveShifts(dateFromStr, dateToStr, headers);
            
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading coffee shops stats:', err);
            this.error = 'Не удалось загрузить статистику по кофейням';
            this.isLoading = false;
          }
        });
        
      } else {
        console.error('Invalid coffee shops response structure');
        this.error = 'Не удалось загрузить список кофеен';
        this.isLoading = false;
      }
    },
    error: (err) => {
      console.error('Error loading coffee shops:', err);
      console.error('Error status:', err.status);
      console.error('Error body:', err.error);
      
      if (err.status === 401 || err.status === 403) {
        console.warn('Authentication failed, redirecting to login');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        this.router.navigate(['/login']);
      } else {
        this.error = err.error?.message || 'Не удалось загрузить список кофеен';
        this.isLoading = false;
      }
    }
  });
}

  private loadActiveShifts(dateFrom: string, dateTo: string, headers: HttpHeaders) {
    // Запрос общей статистики для получения activeShifts
    this.http.get<ApiResponse>(
      `/api/stats/dashboard-summary?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      { headers }
    ).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.activeShiftsToday = response.data.totalShifts || 0;
        }
      },
      error: (err) => {
        console.error('Error loading active shifts:', err);
        // Не показываем ошибку, так как это не критично
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  logout() {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post('/api/auth/logout', {}, { headers }).subscribe({
      next: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      },
      error: () => {
        // Даже при ошибке выходим
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      }
    });
  }
}