// src/app/components/overview/overview.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface CoffeeShopStats {
  name: string;
  address: string;
  totalWage: string;
  hours: number;
  employees: number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="overview-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="40" height="40" fill="url(#pattern0_193_665)"/>
              <defs>
                <pattern id="pattern0_193_665" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image0_193_665" transform="translate(-0.0348837) scale(0.0116279)"/>
                </pattern>
                <image id="image0_193_665" width="92" height="86" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABWCAYAAABCdPE+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQ6SURBVHhe7ZzdbxRVGId/eA3/FDf8FyZ6pf4Bpg0JQsKFHxUVokFQAqGLbWpjtx9QpRRlMVQLxbAkrU1T0022aW3ZmZ3ZnZmdr+NFKZr3QhI47/mYmefyOXdPdpPded85R4QQAhXKeIOKCl6q4IqpgiumCq6YKrhirAse/jFPlXREGiN6skC1FKwKnnXa8OojVEvHmx5But+iWgr2BM8zOKNDEGlMT6QyWLuP4LcfqJaGNcH9Hy8iaa9RLZXcfwZ37AOqpWJF8KTVRO+Xa1TLRQg4tWHkoUdPpGJ8cBH14dSGAeYnEL2fryH+6zHV0jE+uDt5Fpm7S7VUku0/4f90kWoWjA4ertxk+3l2iIhDONffB/KMHrFgbPDM3UW3/jHV0ulOfYSss001G2YGFzmc2jBE1KcnUomaiwgfzVHNipHBe4tXkLSaVEslc3fhTpyhmh3jgiftNfi3L1MtF5HDqQ1BDAJ6wo5RwUUcwhkdAkROj6TiL1xG0npKtRKMCu5NjyDrtKmWStJ6it6dK1Qrw5jg0WoDwfI01VIRgwBOjf8b9H8YETz399EdP021dNyJM+x/ol6G/uBCwLlxkv0ZRvBwBlFzkWrlaA/eb9QQb65QLZWssw2v/gnVWjiicy8l3dnA/vk3IbKEHmnn2Il3cfT421S/Nto+4SKNDwYKBsbmRFtwb/ZzpHtbVBceLcEH60sIHkxQXQqUB8/7DtyxU1SXBuXB3bFTyPsO1aVBafDgwfcYrC9RXSqUBU/3tuDNfkZ16VATXNFOiQ0oCe7Nf4l0Z4PqUsIePN5cQf/eKNWlhTV4Hnpwbpxk3ymxCdbg3fHTyP19qksNW/Dw4Syi1QbVpYcleNZpK9kpsRH5wUV+8BMwDulJBUdwf+Eb9rVim5EaPGk10bvzLdUV/0HqxCd8NIuUeU8v7/6NYLlOtXSOnXgPR4+/RfVrIzU4O0Lg2aV32GegKOKI7VXo3buuJDYn1gRPdzbgz39FtXVYEfxw4KxqaZ4TK4J7M+cKM3A2PvhgfQnB0iTV1mJ08CIOnI0OXsSBs7HB+7+OF3LgbGTwdG8L/twXVBcC44KLLCn0zqFxwf1bxR44GxU83lxBv1GjulAYE/zFwLngGBO8LANnI4IHy/XSDJy1B886bXjTn1JdWPQGP9w5LNHAWWtw//al0g2ctQVPWk307l6luvBoCf7vPVb6XsHWhZbg3akPtb+CrQvlwaMnCwgf819naipKg2fuLtzJs1SXCnXBn1/EyH2PlekoC967e5X9HisbUBL84B6rr6kuJezBX9xjVYCdEhmwB/dmzrHfY2UTrMGj1QaC36eoLjVswVXdY2UbbMFV3GNlIyzB+/e/s36tmAvpwdOdDfg3L1Bd8RypwYu+UyIDqcH9ufOFWSvmwq53fAqA1E94xcupgiumCq6YKrhiquCKqYIr5h/7OBGFuy7lhAAAAABJRU5ErkJggg=="/>
              </defs>
          </svg>
        </div>

        <nav class="nav">
          <button class="nav-item active" routerLink="/overview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
          </button>
          <button class="nav-item" routerLink="/admin-schedule">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button class="nav-item" routerLink="/coffee-shops">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </button>
          <button class="nav-item" routerLink="/employees">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" routerLink="/login" title="Выход">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Header -->
        <header class="header">
          <div>
            <h1>Обзор системы</h1>
            <p class="subtitle">Статистика за последние 30 дней</p>
          </div>
        </header>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Количество филиалов кофеен – 5</div>
            </div>
            <div class="stat-trend">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB088" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Общее количество сотрудников – 27</div>
            </div>
            <div class="stat-trend">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB088" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Общий ФОТ (30 дней) – 266 660 ₽</div>
            </div>
            <div class="stat-trend">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB088" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Общая отработка часов – 1000ч</div>
            </div>
            <div class="stat-trend">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB088" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-header">
              <h3>Среднее количество часов на сотрудника</h3>
              <div class="trend-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB088" stroke-width="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
              </div>
            </div>
            <div class="info-value">260 ч</div>
            <div class="info-subtitle">За последние 30 дней</div>
          </div>

          <div class="info-card">
            <div class="info-header">
              <h3>Активных смен</h3>
              <div class="trend-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB088" stroke-width="2">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                </svg>
              </div>
            </div>
            <div class="info-value">10</div>
            <div class="info-subtitle">Запланировано на сегодня</div>
          </div>
        </div>

        <!-- Coffee Shops Table -->
        <div class="table-container">
          <h2 class="table-title">Производительность по кофейням</h2>
          <p class="table-subtitle">За последние 30 дней</p>

          <div class="table-wrapper">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Кофейня</th>
                  <th>Адрес</th>
                  <th>ФОТ</th>
                  <th>Часов</th>
                  <th>Сотрудников</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let shop of coffeeShops">
                  <td class="shop-name">{{ shop.name }}</td>
                  <td class="shop-address">{{ shop.address }}</td>
                  <td class="shop-wage">{{ shop.totalWage }}</td>
                  <td class="shop-hours">{{ shop.hours }} ч</td>
                  <td class="shop-employees">{{ shop.employees }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .overview-container {
      display: flex;
      min-height: 100vh;
      background: #FAFAFA;
    }

    /* Sidebar */
    .sidebar {
      width: 100px;
      background: white;
      border-right: 1px solid #E5E5E5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
    }

    .logo {
      margin-bottom: 40px;
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex: 1;
    }

    .nav-item {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #999;
      transition: all 0.3s;
    }

    .nav-item:hover {
      background: #F5F5F5;
      color: #FF8C42;
    }

    .nav-item.active {
      background: #FF8C42;
      color: white;
    }

    .sidebar-footer {
      margin-top: auto;
    }

    /* Main Content */
    .main-content {
      margin-left: 100px;
      flex: 1;
      padding: 30px;
    }

    .header {
      margin-bottom: 30px;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 5px 0;
      color: #1a1a1a;
    }

    .subtitle {
      color: #999;
      font-size: 14px;
      margin: 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      display: flex;
      align-items: flex-start;
      gap: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: all 0.3s;
    }

    .stat-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.orange {
      background: #FFE8D9;
      color: #FF8C42;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    .stat-trend {
      flex-shrink: 0;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .info-card {
      background: white;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: all 0.3s;
    }

    .info-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .info-header h3 {
      font-size: 14px;
      font-weight: 500;
      color: #666;
      margin: 0;
      line-height: 1.4;
    }

    .trend-icon {
      flex-shrink: 0;
    }

    .info-value {
      font-size: 48px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
      line-height: 1;
    }

    .info-subtitle {
      font-size: 13px;
      color: #999;
    }

    /* Table */
    .table-container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .table-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 5px 0;
    }

    .table-subtitle {
      font-size: 13px;
      color: #999;
      margin: 0 0 25px 0;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .stats-table {
      width: 100%;
      border-collapse: collapse;
    }

    .stats-table thead th {
      text-align: left;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #FF8C42;
      border-bottom: 2px solid #F5F5F5;
    }

    .stats-table tbody td {
      padding: 20px 16px;
      font-size: 14px;
      color: #1a1a1a;
      border-bottom: 1px solid #F5F5F5;
    }

    .stats-table tbody tr:hover {
      background: #FAFAFA;
    }

    .stats-table tbody tr:last-child td {
      border-bottom: none;
    }

    .shop-name {
      font-weight: 500;
    }

    .shop-address {
      color: #666;
    }

    .shop-wage {
      font-weight: 500;
    }

    .shop-hours {
      color: #666;
    }

    .shop-employees {
      color: #666;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 20px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .table-container {
        padding: 20px;
      }
    }
  `]
})
export class OverviewComponent implements OnInit {
  private router = inject(Router);

  coffeeShops: CoffeeShopStats[] = [
    {
      name: 'Simple Coffee Академ',
      address: 'Ленина, 15',
      totalWage: '29 100 ₽',
      hours: 64,
      employees: 5
    },
    {
      name: 'Simple Coffee Южная',
      address: 'Комсомольская, 77',
      totalWage: '25 800 ₽',
      hours: 78,
      employees: 3
    },
    {
      name: 'Simple Coffee Чехова',
      address: 'Сирябкина, 32',
      totalWage: '36 400 ₽',
      hours: 97,
      employees: 6
    }
  ];

  ngOnInit() {}
}