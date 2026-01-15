// src/app/components/schedule/schedule.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'sick' | 'regular' | 'vacation';
  status: string;
}

interface Employee {
  id: string;
  name: string;
}

interface Day {
  date: string;
  dayNumber: number;
  dayName: string;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="schedule-container">
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
          <button class="nav-item" routerLink="/overview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
          </button>
          <button class="nav-item active" routerLink="/schedule">
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
            </svg>
          </button>
        </nav>

        <div class="sidebar-footer" routerLink="/admin-schedule">
          <button class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 3"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Header -->
        <header class="header">
          <div>
            <h1>Расписание{{ selectedFilterEmployee ? ' – ' + selectedFilterEmployee.name : '' }}</h1>
            <p class="subtitle">{{ selectedFilterEmployee ? 'Расписание бариста ' + selectedFilterEmployee.name : 'Управление расписанием кофеен' }}</p>
          </div>
        </header>

        <!-- Filters -->
        <div class="filters">
          <div class="counter">Всего кофеен – 9</div>
          
          <div class="filter-group">
            <button class="filter-btn" (click)="showCoffeeFilter = !showCoffeeFilter">
              Все кофейни
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="dropdown-menu" *ngIf="showCoffeeFilter">
              <button class="dropdown-item">Все кофейни</button>
              <button class="dropdown-item">Центральный</button>
              <button class="dropdown-item">Ванцетти</button>
            </div>
          </div>

          <div class="filter-group">
            <button class="filter-btn" (click)="showEmployeeFilter = !showEmployeeFilter">
              {{ selectedFilterEmployee ? selectedFilterEmployee.name : 'Все сотрудники' }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="dropdown-menu" *ngIf="showEmployeeFilter">
              <button class="dropdown-item" (click)="selectEmployeeFilter(null)">Все сотрудники</button>
              <button class="dropdown-item" *ngFor="let emp of employees" (click)="selectEmployeeFilter(emp)">
                {{ emp.name }}
              </button>
            </div>
          </div>

          <button class="export-btn">
            Экспорт
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>

        <!-- Calendar Navigation -->
        <div class="calendar-nav">
          <button class="nav-btn" (click)="previousMonth()">‹</button>
          <span class="date-range">{{ monthYearDisplay }}</span>
          <button class="nav-btn" (click)="nextMonth()">›</button>
        </div>

        <!-- Week Days Header -->
        <div class="schedule-header">
          <div class="header-employee"></div>
          <div class="header-day" *ngFor="let day of weekDays">
            <div class="day-short">{{ day.dayName }}</div>
            <div class="day-number">{{ day.dayNumber }}</div>
          </div>
        </div>

        <!-- Schedule Grid -->
        <div class="schedule-grid">
          <div class="schedule-row" *ngFor="let employee of getFilteredEmployees()">
            <div class="employee-name-cell">{{ employee.name }}</div>
            
            <div class="shift-cell" 
                 *ngFor="let day of weekDays"
                 (click)="openShiftModal(employee, day)"
                 [class.has-shift]="getShift(employee.id, day.date)">
              <div *ngIf="getShift(employee.id, day.date) as shift" 
                   class="shift-box"
                   [class.shift-sick]="shift.type === 'sick'"
                   [class.shift-vacation]="shift.type === 'vacation'"
                   [class.shift-regular]="shift.type === 'regular'"
                   (click)="$event.stopPropagation()">
                <div class="shift-type">{{ getShiftLabel(shift.type) }}</div>
                <div class="shift-time">{{ shift.startTime }} - {{ shift.endTime }}</div>
                <div class="shift-hours">{{ calculateHours(shift.startTime, shift.endTime) }} часов</div>
                <div class="shift-actions">
                  <button class="shift-edit" (click)="editShift(employee, day, shift)">✎</button>
                  <button class="shift-delete" (click)="deleteShift(shift)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Add Shift Modal -->
      <div class="modal-overlay" *ngIf="showAddModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingShift ? 'Изменить смену' : 'Добавить смену' }}</h3>
          
          <form>
            <div class="form-group">
              <label>Тип</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="type" value="regular" [(ngModel)]="newShift.type">
                  Смена
                </label>
                <label class="radio-label">
                  <input type="radio" name="type" value="sick" [(ngModel)]="newShift.type">
                  Больничный
                </label>
                <label class="radio-label">
                  <input type="radio" name="type" value="vacation" [(ngModel)]="newShift.type">
                  Отпуск
                </label>
              </div>
            </div>

            <div class="form-group" *ngIf="newShift.type === 'regular'">
              <label>Начало</label>
              <input type="time" class="form-control" [(ngModel)]="newShift.startTime" name="startTime">
            </div>

            <div class="form-group" *ngIf="newShift.type === 'regular'">
              <label>Конец</label>
              <input type="time" class="form-control" [(ngModel)]="newShift.endTime" name="endTime">
            </div>

            <div class="form-group" *ngIf="newShift.type !== 'regular'">
              <label>Комментарий (необязательно)</label>
              <textarea class="form-control" [(ngModel)]="newShift.comment" name="comment" placeholder="Введите комментарий..."></textarea>
            </div>
          </form>

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeModal()">Отменить</button>
            <button class="btn-primary" (click)="saveShift()">{{ editingShift ? 'Сохранить' : 'Добавить' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .schedule-container {
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
      z-index: 100;
    }

    .logo {
      margin-bottom: 40px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
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
      overflow-x: auto;
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

    /* Filters */
    .filters {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .counter {
      font-size: 14px;
      color: #666;
    }

    .filter-group {
      position: relative;
    }

    .filter-btn {
      padding: 10px 16px;
      border: 1px solid #E5E5E5;
      background: white;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .filter-btn:hover {
      border-color: #FF8C42;
      color: #FF8C42;
    }

    .export-btn {
      padding: 10px 16px;
      border: 1px solid #E5E5E5;
      background: white;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
      margin-left: auto;
    }

    .export-btn:hover {
      border-color: #FF8C42;
      color: #FF8C42;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 200px;
      z-index: 10;
      margin-top: 5px;
    }

    .dropdown-item {
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .dropdown-item:hover {
      background: #F5F5F5;
    }

    /* Calendar Navigation */
    .calendar-nav {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      justify-content: space-between;
    }

    .nav-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #E5E5E5;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .nav-btn:hover {
      border-color: #FF8C42;
      color: #FF8C42;
    }

    .date-range {
      font-size: 14px;
      color: #666;
      min-width: 200px;
      text-align: center;
    }

    /* Schedule Header */
    .schedule-header {
      display: grid;
      grid-template-columns: 180px repeat(7, 1fr);
      gap: 2px;
      margin-bottom: 10px;
      background: white;
      padding: 15px;
      border-radius: 8px;
    }

    .header-employee {
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
    }

    .header-day {
      text-align: center;
      padding: 10px 5px;
    }

    .day-short {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }

    .day-number {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    /* Schedule Grid */
    .schedule-grid {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    .schedule-row {
      display: grid;
      grid-template-columns: 180px repeat(7, 1fr);
      gap: 2px;
      min-height: 100px;
      border-bottom: 1px solid #F5F5F5;
      padding: 2px;
    }

    .schedule-row:hover {
      background: #FAFAFA;
    }

    .employee-name-cell {
      padding: 15px;
      font-weight: 500;
      color: #1a1a1a;
      display: flex;
      align-items: center;
    }

    .shift-cell {
      padding: 8px;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
    }

    .shift-cell:hover {
      background: #F9F9F9;
    }

    .shift-box {
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
      min-height: 70px;
      transition: all 0.3s;
    }

    .shift-box:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .shift-regular {
      background: #FFE4D1;
      color: #8B4513;
    }

    .shift-sick {
      background: #B8D4E8;
      color: #2C5F7F;
    }

    .shift-vacation {
      background: #FFB8B8;
      color: #8B2E2E;
    }

    .shift-type {
      font-weight: 600;
      font-size: 11px;
    }

    .shift-time {
      font-size: 11px;
      opacity: 0.9;
    }

    .shift-hours {
      font-size: 10px;
      opacity: 0.8;
    }

    .shift-actions {
      display: flex;
      gap: 4px;
      margin-top: auto;
    }

    .shift-edit,
    .shift-delete {
      width: 20px;
      height: 20px;
      border: none;
      background: rgba(0,0,0,0.1);
      color: inherit;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      transition: all 0.2s;
    }

    .shift-edit:hover,
    .shift-delete:hover {
      background: rgba(0,0,0,0.2);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 16px;
      padding: 30px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .modal h3 {
      margin: 0 0 25px 0;
      font-size: 20px;
      color: #1a1a1a;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .radio-label input {
      cursor: pointer;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #FF8C42;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 25px;
    }

    .btn-secondary {
      flex: 1;
      padding: 12px;
      border: 1px solid #E5E5E5;
      background: white;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-secondary:hover {
      background: #F5F5F5;
    }

    .btn-primary {
      flex: 1;
      padding: 12px;
      border: none;
      background: #1a1a1a;
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary:hover {
      background: #333;
    }

    @media (max-width: 1200px) {
      .schedule-header,
      .schedule-row {
        grid-template-columns: 150px repeat(7, 1fr);
      }

      .employee-name-cell {
        font-size: 13px;
        padding: 10px;
      }
    }
  `]
})
export class ScheduleComponent implements OnInit {
  currentDate = new Date();
  weekDays: Day[] = [];
  monthYearDisplay = '';

  showAddModal = false;
  showCoffeeFilter = false;
  showEmployeeFilter = false;
  editingShift: Shift | null = null;
  selectedEmployee: Employee | null = null;
  selectedDay: Day | null = null;
  selectedFilterEmployee: Employee | null = null;

  newShift = {
    type: 'regular',
    startTime: '08:00',
    endTime: '16:00',
    comment: ''
  };

  employees: Employee[] = [
    { id: '1', name: 'Дмитрий Иванов' },
    { id: '2', name: 'Алиса Мищенко' },
    { id: '3', name: 'Женя Воробушкина' },
    { id: '4', name: 'Мария Вознесенская' },
    { id: '5', name: 'Константин Прибылов' },
    { id: '6', name: 'Яна Дмитриенко' }
  ];

  shifts: Shift[] = [
    { id: '1', employeeId: '1', employeeName: 'Дмитрий Иванов', date: '2025-11-20', startTime: '08:00', endTime: '16:00', type: 'regular', status: 'В смене' },
    { id: '2', employeeId: '2', employeeName: 'Алиса Мищенко', date: '2025-11-22', startTime: '12:00', endTime: '18:00', type: 'regular', status: 'В смене' },
    { id: '3', employeeId: '3', employeeName: 'Женя Воробушкина', date: '2025-11-21', startTime: '17:00', endTime: '22:00', type: 'sick', status: 'Больничный' }
  ];

  ngOnInit() {
    this.updateWeekDays();
  }

  getFilteredEmployees(): Employee[] {
    if (!this.selectedFilterEmployee) {
      return this.employees;
    }
    return [this.selectedFilterEmployee];
  }

  selectEmployeeFilter(employee: Employee | null) {
    this.selectedFilterEmployee = employee;
    this.showEmployeeFilter = false;
  }

  updateWeekDays() {
    this.weekDays = [];
    const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    
    // Начало с понедельника текущей недели первого дня месяца
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);

    // Берём только одну неделю для отображения
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
      const dayName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      this.weekDays.push({
        date: this.formatDate(date),
        dayNumber: date.getDate(),
        dayName: dayName,
        isCurrentMonth: isCurrentMonth
      });
    }

    this.updateMonthDisplay();
  }

  updateMonthDisplay() {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const startDate = new Date(this.weekDays[0].date);
    const endDate = new Date(this.weekDays[6].date);
    
    const startStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const endStr = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    this.monthYearDisplay = `${startStr} - ${endStr}`;
  }

  previousMonth() {
    this.currentDate.setDate(1);
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateWeekDays();
  }

  nextMonth() {
    this.currentDate.setDate(1);
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateWeekDays();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getShift(employeeId: string, date: string): Shift | undefined {
    return this.shifts.find(s => s.employeeId === employeeId && s.date === date);
  }

  getShiftLabel(type: string): string {
    const labels = {
      'regular': 'Смена',
      'sick': 'Больничный',
      'vacation': 'Отпуск'
    };
    return labels[type as keyof typeof labels] || '';
  }

  calculateHours(startTime: string, endTime: string): number {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    return endHour - startHour;
  }

  openShiftModal(employee: Employee, day: Day) {
    this.selectedEmployee = employee;
    this.selectedDay = day;
    this.editingShift = null;
    this.newShift = {
      type: 'regular',
      startTime: '08:00',
      endTime: '16:00',
      comment: ''
    };
    this.showAddModal = true;
  }

  editShift(employee: Employee, day: Day, shift: Shift) {
    this.selectedEmployee = employee;
    this.selectedDay = day;
    this.editingShift = shift;
    this.newShift = {
      type: shift.type,
      startTime: shift.startTime,
      endTime: shift.endTime,
      comment: ''
    };
    this.showAddModal = true;
  }

  saveShift() {
    if (!this.selectedEmployee || !this.selectedDay) return;

    if (this.editingShift) {
      const index = this.shifts.findIndex(s => s.id === this.editingShift!.id);
      if (index !== -1) {
        this.shifts[index] = {
          ...this.shifts[index],
          type: this.newShift.type as any,
          startTime: this.newShift.startTime,
          endTime: this.newShift.endTime,
          status: this.getShiftLabel(this.newShift.type)
        };
      }
    } else {
      const newShift: Shift = {
        id: Date.now().toString(),
        employeeId: this.selectedEmployee.id,
        employeeName: this.selectedEmployee.name,
        date: this.selectedDay.date,
        startTime: this.newShift.startTime,
        endTime: this.newShift.endTime,
        type: this.newShift.type as any,
        status: this.getShiftLabel(this.newShift.type)
        };
      this.shifts.push(newShift);
      }
      this.closeModal();
  }
  deleteShift(shift: Shift) {
    if (confirm("Вы уверены, что хотите удалить эту смену?")) {
      this.shifts = this.shifts.filter(s => s.id !== shift.id);
    }
  }
  closeModal() {
    this.showAddModal = false;
    this.selectedEmployee = null;
    this.selectedDay = null;
    this.editingShift = null;
  }
}