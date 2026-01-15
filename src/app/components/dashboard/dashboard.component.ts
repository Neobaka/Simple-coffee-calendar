// src/app/components/dashboard/dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="dashboard">
    <header class="header">
      <h1>☕ Simple Coffee - Панель управления</h1>
      <button class="logout-btn" (click)="logout()">Выйти</button>
    </header>

    <div class="content" *ngIf="user">
      <div class="welcome-card">
        <h2>☕ Добро пожаловать, {{ user.fullName || user.email }}!</h2>
        <p>📧 Email: {{ user.email }}</p>
        <p *ngIf="user.role">🎭 Роль: {{ user.role }}</p>
        <p *ngIf="user.coffeeShop" class="coffee-shop">
          🏪 Кофейня: {{ user.coffeeShop.name }} ({{ user.coffeeShop.address }})
        </p>
        <p class="user-id">🆔 ID: {{ user.id }}</p>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h3>☕ Кофейня</h3>
          <p *ngIf="user.coffeeShop">{{ user.coffeeShop.name }}</p>
          <p *ngIf="user.coffeeShop">{{ user.coffeeShop.phone }}</p>
          <p *ngIf="user.coffeeShop">Режим работы: {{ user.coffeeShop.openTime }} - {{ user.coffeeShop.closeTime }}</p>
        </div>
        
        <div class="info-card">
          <h3>📊 Приложение </h3>
          <button class="nav-btn" routerLink="/overview">
            📅 Перейти к расписанию админа
          </button>
          <button class="nav-btn" routerLink="/person-schedule">
            📅 Перейти к расписанию баристы
          </button>

        </div>
        
        <div class="info-card">
          <h3>⚙️ Настройки</h3>
          <p>Управление профилем и настройками системы</p>
        </div>
      </div>
    </div>
  </div>
`,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f5f5f5;
    }

    .header {
      background: white;
      padding: 20px 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }

    .logout-btn {
      padding: 10px 24px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .logout-btn:hover {
      background: #d32f2f;
    }

    .content {
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-card {
      background: linear-gradient(135deg, #FF702280  0%, #FF7022  100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .welcome-card h2 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }

    .welcome-card p {
      margin: 0;
      opacity: 0.9;
      font-size: 18px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .info-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .info-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .info-card h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 20px;
    }

    .info-card p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  user: User | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}