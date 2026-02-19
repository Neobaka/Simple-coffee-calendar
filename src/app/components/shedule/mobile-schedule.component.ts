// src/app/components/shedule/mobile-schedule.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { ShiftService, Shift as ApiShift } from '../../services/shift.service';
import { WishService, WishCreate } from '../../services/wish.service';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

interface WeekDay {
  date: string;
  shortLabel: string;
  dayNumber: number;
  isSelected: boolean;
  hasShift: boolean;
  shiftType: 'work' | 'sick_leave' | 'vacation' | 'day_off' | 'none';
}

interface Coworker {
  name: string;
  time: string;
}

interface DayShift {
  date: string;
  type: 'work' | 'sick_leave' | 'vacation' | 'day_off';
  startTime?: string;
  endTime?: string;
  coworkers?: Coworker[];
}

interface TimePreference {
  day: string;
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-mobile-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, TuiButton, TuiIcon],
  template: `
    <div class="mobile-shell">
      <!-- Top bar -->
      <header class="top-bar">
        <button tuiButton size="s" appearance="flat" class="icon-button icon-button_taiga" (click)="toggleProfileCard()">
          <tui-icon icon="@tui.user" />
        </button>

        <div class="logo-wordmark">
          <span class="logo-text-main">simple coffee</span>
          <span class="logo-accent">1</span>
        </div>

        <button tuiButton size="s" appearance="flat" class="icon-button icon-button_taiga" (click)="toggleNotifications()">
          <tui-icon icon="@tui.bell" />
        </button>

        <!-- Плашка профиля -->
        <div class="profile-card" *ngIf="showProfile">
          <div class="profile-card-header">
            <div class="profile-avatar">
              <span>{{ initials }}</span>
            </div>
            <div class="profile-text">
              <div class="profile-name">{{ employeeName }}</div>
              <div class="profile-role">Должность: {{ employeeRoleLabel }}</div>
            </div>
          </div>
          <div class="profile-meta">
            <div class="meta-row">
              <span class="meta-label">Филиал</span>
              <span class="meta-value">{{ coffeeShopLabel }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Статус аккаунта</span>
              <span class="meta-status">Активный</span>
            </div>
          </div>
          <button tuiButton size="s" appearance="secondary" class="logout-btn" (click)="logout()">
            Выйти
          </button>
        </div>

        <!-- Плашка уведомлений -->
        <div class="notifications-card" *ngIf="showNotifications">
          <div class="notif-title">Новые уведомления</div>
          <div class="notif-body">
            Нет активных уведомлений
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="content">
        <!-- Section 1: week schedule -->
        <section class="section">
          <div class="section-title-row">
            <span class="section-index">1</span>
            <h2>Расписание смен на предстоящую неделю</h2>
          </div>

          <div class="week-card">
            <div class="week-header">
            <button tuiButton size="s" appearance="flat" class="arrow-btn" (click)="previousWeek()">
              <tui-icon icon="@tui.chevron-left" />
            </button>
              <div class="week-range">{{ weekRangeLabel }} г.</div>
              <button tuiButton size="s" appearance="flat" class="arrow-btn" (click)="nextWeek()">
                <tui-icon icon="@tui.chevron-right" />
              </button>
            </div>

            <div class="week-days">
              <button
                class="day-pill"
                *ngFor="let day of weekDays"
                [class.selected]="day.isSelected"
                (click)="selectDay(day)"
              >
                <span class="day-short">{{ day.shortLabel }}</span>
                <span class="day-number">{{ day.dayNumber }}</span>
                <div
                  class="day-icon"
                  [class.day-icon-active]="day.hasShift && day.shiftType === 'work'"
                  [class.day-icon-sick]="day.shiftType === 'sick_leave'"
                  [class.day-icon-vacation]="day.shiftType === 'vacation'"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 19h18"></path>
                    <path d="M7 19V9a5 5 0 0 1 10 0v10"></path>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div class="selected-day-card" *ngIf="selectedDay">
            <div class="selected-day-header">
              <div class="selected-day-label">{{ getSelectedDayLabel() }}</div>
              <div class="selected-day-tag" *ngIf="selectedShift?.type === 'work'">Смена</div>
              <div class="selected-day-tag selected-day-tag-sick" *ngIf="selectedShift?.type === 'sick_leave'">Больничный</div>
              <div class="selected-day-tag selected-day-tag-vac" *ngIf="selectedShift?.type === 'vacation'">Отпуск</div>
            </div>

            <ng-container *ngIf="selectedShift; else noShift">
              <div class="selected-day-main" *ngIf="selectedShift.type === 'work'">
                <div class="time-row">
                  <span class="time-label">Ваша смена</span>
                  <span class="time-value">
                    {{ selectedShift.startTime }} – {{ selectedShift.endTime }}
                  </span>
                </div>
              </div>

              <div class="coworkers-block" *ngIf="selectedShift.coworkers?.length">
                <div class="coworkers-title">Другие работники</div>
                <div class="coworker-row" *ngFor="let coworker of selectedShift.coworkers">
                  <span class="coworker-name">{{ coworker.name }}</span>
                  <span class="coworker-time">{{ coworker.time }}</span>
                </div>
              </div>
            </ng-container>

            <ng-template #noShift>
              <div class="no-shift-text">
                В этот день у вас нет смены.
              </div>
            </ng-template>
          </div>
        </section>

        <!-- Section 2: stats -->
        <section class="section">
          <div class="section-title-row">
            <span class="section-index">2</span>
            <h2>Статистика вашей работы за прошедшие 30 дней</h2>
          </div>

          <div class="stats-card">
            <button tuiButton size="s" appearance="secondary" class="stat-pill">
              <span class="stat-label">Количество ваших рабочих смен</span>
              <span class="stat-value">{{ stats.shiftsCount }}</span>
            </button>
            <button tuiButton size="s" appearance="secondary" class="stat-pill">
              <span class="stat-label">Количество отработанных вами часов</span>
              <span class="stat-value">{{ stats.workedHours }}</span>
            </button>
            <button tuiButton size="s" appearance="secondary" class="stat-pill">
              <span class="stat-label">Часы, отданные сверхурочной работе</span>
              <span class="stat-value">{{ stats.overtimeHours }}</span>
            </button>
          </div>
        </section>

        <!-- Section 3: желаемые часы работы (как в person-schedule) -->
        <section class="section">
          <div class="wishes-info-tip">
            <span class="wishes-info-icon">i</span>
            <span class="wishes-info-text">Укажите желаемые часы работы на предстоящую неделю</span>
          </div>

          <div class="wishes-card wishes-card-form">
            <div class="wishes-preferences-list">
              <div class="wishes-pref-row" *ngFor="let pref of preferencesDays; let i = index">
                <div class="wishes-pref-day">{{ pref.day }}</div>
                <div class="wishes-pref-time-row">
                  <span class="wishes-pref-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                  <span class="wishes-pref-sep">/</span>
                  <span class="wishes-pref-label">с</span>
                  <input type="time" class="wishes-time-input" [(ngModel)]="pref.startTime" [name]="'start-' + i" />
                  <span class="wishes-pref-label">до</span>
                  <input type="time" class="wishes-time-input" [(ngModel)]="pref.endTime" [name]="'end-' + i" />
                </div>
              </div>
            </div>
            <div class="wishes-actions">
              <button tuiButton size="s" appearance="secondary" class="wishes-btn-reset" (click)="resetPreferences()">
                Сбросить
              </button>
              <button tuiButton size="s" appearance="secondary" class="wishes-btn-submit" (click)="savePreferences()" [disabled]="isSavingWishes">
                Отправить выбор
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    .mobile-shell {
      min-height: 100vh;
      background: #f7f4f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      display: flex;
      flex-direction: column;
      max-width: 430px;
      margin: 0 auto;
    }

    .top-bar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
      background: #ffffff;
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
    }

    .icon-button {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid #e4e0da;
      background: #faf7f3;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #8b7a64;
      padding: 0;
    }

    .logo-wordmark {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-weight: 600;
    }

    .logo-text-main {
      font-size: 16px;
      letter-spacing: 0.02em;
    }

    .logo-accent {
      color: #ff7a2e;
      font-size: 18px;
    }

    .profile-card {
      position: absolute;
      left: 12px;
      top: 52px;
      width: 260px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
      padding: 14px 14px 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .profile-card-header {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .profile-avatar {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #f4e4d1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #7b5530;
    }

    .profile-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .profile-name {
      font-size: 13px;
      font-weight: 600;
    }

    .profile-role {
      font-size: 12px;
      color: #8b8b8b;
    }

    .profile-meta {
      padding-top: 4px;
      border-top: 1px solid #f1ece4;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .meta-label {
      color: #9b8f80;
    }

    .meta-value {
      font-weight: 500;
      color: #3b342b;
    }

    .meta-status {
      font-weight: 500;
      color: #1a7f37;
    }

    .logout-btn {
      margin-top: 6px;
      align-self: flex-start;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #e4d9cf;
      background: #faf4ee;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      color: #5c4731;
    }

    .notifications-card {
      position: absolute;
      left: 16px;
      right: 16px;
      top: 52px;
      background: #ffffff;
      border-radius: 18px;
      padding: 12px 14px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notif-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #b36b30;
      font-weight: 600;
    }

    .notif-body {
      font-size: 13px;
      color: #3b342b;
    }

    .content {
      flex: 1;
      padding: 12px 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-index {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      border: 1px solid #f1c38b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #c96a26;
      flex-shrink: 0;
    }

    .section-title-row h2 {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }

    .week-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 14px 14px 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .week-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #6b6154;
    }

    .week-range {
      font-weight: 500;
    }

    .arrow-btn {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 1px solid #e4d9cf;
      background: #faf4ee;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      cursor: pointer;
      font-size: 16px;
      color: #7a6046;
    }

    .week-days {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .day-pill {
      flex: 0 0 46px;
      border-radius: 18px;
      border: 1px solid transparent;
      background: #f4eee7;
      padding: 6px 4px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      color: #7a6a58;
      font-size: 11px;
    }

    .day-pill.selected {
      background: #111111;
      color: #ffffff;
    }

    .day-short {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
    }

    .day-number {
      font-size: 14px;
      font-weight: 600;
    }

    .day-icon {
      margin-top: 2px;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c4b59f;
    }

    .day-pill.selected .day-icon {
      background: #fdf2e6;
      border-color: #f7d1a5;
      color: #c96a26;
    }

    .day-icon-active {
      color: #c96a26;
    }

    .day-icon-sick {
      color: #b3261e;
    }

    .day-icon-vacation {
      color: #0b8067;
    }

    .selected-day-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 14px 14px 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .selected-day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .selected-day-label {
      font-size: 13px;
      font-weight: 500;
      color: #3b342b;
    }

    .selected-day-tag {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      background: #fdf2e6;
      color: #c96a26;
      border: 1px solid #f5cf9f;
    }

    .selected-day-tag-sick {
      background: #ffe5e1;
      border-color: #ffb3a7;
      color: #b3261e;
    }

    .selected-day-tag-vac {
      background: #e3f5ef;
      border-color: #b5e3d2;
      color: #0b8067;
    }

    .selected-day-main {
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .time-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .time-label {
      color: #8b8176;
    }

    .time-value {
      font-weight: 600;
    }

    .coworkers-block {
      padding-top: 4px;
      border-top: 1px dashed #efe2d4;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .coworkers-title {
      font-size: 12px;
      color: #8b8176;
      margin-bottom: 2px;
    }

    .coworker-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 2px 0;
    }

    .coworker-name {
      color: #3b342b;
    }

    .coworker-time {
      color: #8b8176;
    }

    .no-shift-text {
      font-size: 13px;
      color: #8b8176;
    }

    .stats-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 14px 14px 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat-pill {
      width: 100%;
      border-radius: 999px;
      border: 1px solid #efe2d4;
      background: #faf4ee;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      cursor: default;
    }

    .stat-label {
      color: #5f5343;
      text-align: left;
    }

    .stat-value {
      font-weight: 600;
      color: #111111;
      padding-left: 8px;
    }

    .wishes-card {
      background: #ffffff;
      border-radius: 22px;
      padding: 14px 14px 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .wishes-image {
      width: 100%;
      border-radius: 18px;
      background: radial-gradient(circle at 20% 20%, #f9e0c7, #d9c7b4);
      aspect-ratio: 4 / 3;
    }

    .wishes-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0;
      color: #3b342b;
    }

    .wishes-text {
      font-size: 12px;
      color: #8b8176;
      margin: 0;
      line-height: 1.4;
    }

    .wishes-info-tip {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 10px;
    }

    .wishes-info-icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #f5a623;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      line-height: 1;
    }

    .wishes-info-text {
      font-size: 13px;
      color: #3b342b;
      line-height: 1.4;
    }

    .wishes-card-form {
      background: #f4eee7;
      border-radius: 20px;
      padding: 14px 14px 18px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    .wishes-preferences-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .wishes-pref-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .wishes-pref-day {
      font-size: 13px;
      font-weight: 600;
      color: #3b342b;
    }

    .wishes-pref-time-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      background: #fff;
      border-radius: 12px;
      padding: 8px 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .wishes-pref-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8b7a64;
    }

    .wishes-pref-sep {
      color: #c4b59f;
      font-size: 12px;
    }

    .wishes-pref-label {
      font-size: 12px;
      color: #6b6154;
    }

    .wishes-time-input {
      width: 72px;
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid #e4e0da;
      background: #faf7f3;
      font-size: 13px;
      color: #1a1a1a;
    }

    .wishes-time-input::-webkit-datetime-edit {
      color: #1a1a1a;
    }

    .wishes-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .wishes-btn-reset {
      background: #e8e4de;
      color: #5f5343;
      border: 1px solid #d9d2c9;
    }

    .wishes-btn-submit {
      background: #f0e9e0;
      color: #5f5343;
      border: 1px solid #e4d9cf;
    }

    @media (min-width: 768px) {
      .mobile-shell {
        border-radius: 32px;
        margin-top: 12px;
        margin-bottom: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }
    }
  `]
})
export class MobileScheduleComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private shiftService = inject(ShiftService);
  private wishService = inject(WishService);

  currentUser: User | null = null;
  employeeName = 'Сотрудник';
  employeeRoleLabel = 'Бариста';
  coffeeShopLabel = 'Simple Coffee';
  userCoffeeShopId = '';

  /** Желаемые часы на предстоящую неделю (как в person-schedule) */
  preferencesDays: TimePreference[] = [];
  isSavingWishes = false;

  currentWeekStart: Date = new Date();
  weekDays: WeekDay[] = [];
  weekRangeLabel = '';
  selectedDay: WeekDay | null = null;

  dayShifts: DayShift[] = [
    {
      date: '2025-11-20',
      type: 'work',
      startTime: '08:00',
      endTime: '18:00',
      coworkers: [
        { name: 'Мария Петрова', time: '12:00 – 22:00' },
        { name: 'Сергей Сафронов', time: '08:00 – 16:00' },
        { name: 'Артём Попов', time: '13:00 – 20:00' }
      ]
    },
    {
      date: '2025-11-21',
      type: 'work',
      startTime: '12:00',
      endTime: '22:00',
      coworkers: []
    },
    {
      date: '2025-11-22',
      type: 'work',
      startTime: '08:00',
      endTime: '18:00',
      coworkers: []
    },
    {
      date: '2025-11-23',
      type: 'day_off'
    },
    {
      date: '2025-11-24',
      type: 'sick_leave'
    },
    {
      date: '2025-11-25',
      type: 'vacation'
    },
    {
      date: '2025-11-26',
      type: 'day_off'
    }
  ];

  stats = {
    shiftsCount: 22,
    workedHours: 128,
    overtimeHours: 2
  };

  showProfile = false;
  showNotifications = false;

  ngOnInit(): void {
    this.loadUser();
    this.currentWeekStart = this.getWeekStart(new Date());
    this.buildWeek();
    this.loadWeekShifts();
    this.initializePreferences();
  }

  get selectedShift(): DayShift | undefined {
    if (!this.selectedDay) {
      return undefined;
    }
    return this.dayShifts.find(s => s.date === this.selectedDay!.date);
  }

  get initials(): string {
    if (!this.employeeName) {
      return '';
    }
    const parts = this.employeeName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  private loadUser(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (this.currentUser) {
      this.employeeName = this.currentUser.fullName || this.currentUser.email;

      if (this.currentUser.role === 'manager') {
        this.employeeRoleLabel = 'Менеджер';
      } else if (this.currentUser.role === 'admin') {
        this.employeeRoleLabel = 'Администратор';
      } else {
        this.employeeRoleLabel = 'Бариста';
      }

      if (typeof this.currentUser.coffeeShop === 'string') {
        this.userCoffeeShopId = this.currentUser.coffeeShop;
        this.coffeeShopLabel = 'Simple Coffee';
      } else if (this.currentUser.coffeeShop) {
        const shop: any = this.currentUser.coffeeShop;
        this.userCoffeeShopId = shop._id || shop.id || '';
        this.coffeeShopLabel = shop.name || shop.address || 'Simple Coffee';
      }
    }
  }

  /** Инициализация пожеланий на следующую неделю (как в person-schedule) */
  initializePreferences(): void {
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const startDate = this.getWeekStart(nextWeekStart);

    this.preferencesDays = [];
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayLabel = `${dayNames[date.getDay()]}, ${date.getDate()} ${date.toLocaleDateString('ru-RU', { month: 'long' })}`;
      this.preferencesDays.push({
        day: dayLabel,
        date: this.formatDate(date),
        startTime: '08:00',
        endTime: '16:00'
      });
    }
  }

  /** Сохранение пожеланий через WishService */
  savePreferences(): void {
    if (!this.currentUser) {
      alert('Ошибка: пользователь не авторизован');
      return;
    }
    if (!this.userCoffeeShopId) {
      alert('Ошибка: не указана кофейня');
      return;
    }
    if (!confirm('Сохранить желаемые часы на следующую неделю? Существующие пожелания будут пропущены.')) {
      return;
    }

    this.isSavingWishes = true;
    let saved = 0;
    let skipped = 0;
    const errors: string[] = [];
    const total = this.preferencesDays.length;

    const checkDone = () => {
      if (saved + skipped + errors.length === total) {
        this.isSavingWishes = false;
        let msg = `Сохранено: ${saved}`;
        if (skipped > 0) msg += `, пропущено (уже есть): ${skipped}`;
        if (errors.length) msg += `\nОшибки:\n${errors.join('\n')}`;
        alert(msg);
      }
    };

    this.preferencesDays.forEach(pref => {
      const wishData: WishCreate = {
        date: pref.date,
        type: 'work',
        startTime: pref.startTime,
        endTime: pref.endTime,
        coffeeShop: this.userCoffeeShopId
      };
      this.wishService.createWish(wishData).subscribe({
        next: () => { saved++; checkDone(); },
        error: (err: any) => {
          if (err?.error?.message?.includes?.('E11000') || err?.error?.message?.includes?.('duplicate')) {
            skipped++;
          } else {
            errors.push(`${pref.day}: ${err?.error?.message || err?.message || 'Ошибка'}`);
          }
          checkDone();
        }
      });
    });
  }

  /** Сброс пожеланий к значениям по умолчанию */
  resetPreferences(): void {
    if (confirm('Сбросить все введённые часы к значениям по умолчанию?')) {
      this.initializePreferences();
    }
  }

  private buildWeek(): void {
    const weekStart = new Date(this.currentWeekStart);
    const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = this.formatDate(date);

      this.weekDays.push({
        date: dateStr,
        shortLabel: weekdayLabels[i],
        dayNumber: date.getDate(),
        isSelected: false,
        hasShift: false,
        shiftType: 'none'
      });
    }

    this.selectedDay = this.weekDays[2] || this.weekDays[0] || null;
    if (this.selectedDay) {
      this.selectedDay.isSelected = true;
    }

    this.updateWeekRange();
  }

  private updateWeekRange(): void {
    if (this.weekDays.length === 0) {
      this.weekRangeLabel = '';
      return;
    }
    const startDate = new Date(this.weekDays[0].date);
    const endDate = new Date(this.weekDays[6].date);

    const startStr = startDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });

    const endStr = endDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    this.weekRangeLabel = `${startStr} – ${endStr}`;
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.buildWeek();
    this.loadWeekShifts();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.buildWeek();
    this.loadWeekShifts();
  }

  selectDay(day: WeekDay): void {
    this.weekDays.forEach(d => (d.isSelected = false));
    day.isSelected = true;
    this.selectedDay = day;
  }

  getSelectedDayLabel(): string {
    if (!this.selectedDay) {
      return '';
    }
    const date = new Date(this.selectedDay.date);
    const weekdayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const dayName = weekdayNames[date.getDay()];
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'long' });
    return `${this.capitalizeFirstLetter(dayName)}, ${day} ${month}`;
  }

  toggleProfileCard(): void {
    this.showProfile = !this.showProfile;
    if (this.showProfile) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfile = false;
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {},
      complete: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  private loadWeekShifts(): void {
    if (!this.currentUser || this.weekDays.length === 0) {
      return;
    }

    const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
    if (!userId) {
      return;
    }

    const weekStartStr = this.weekDays[0].date;

    this.shiftService.getShifts({
      user: userId,
      dateFrom: weekStartStr
    }).subscribe({
      next: (response: any) => {
        let shiftsArray: ApiShift[] = [];

        if (Array.isArray(response)) {
          shiftsArray = response as ApiShift[];
        } else if (response?.data && Array.isArray(response.data.shifts)) {
          shiftsArray = response.data.shifts as ApiShift[];
        } else if (Array.isArray(response?.shifts)) {
          shiftsArray = response.shifts as ApiShift[];
        } else if (Array.isArray(response?.data)) {
          shiftsArray = response.data as ApiShift[];
        }

        const weekStart = new Date(this.weekDays[0].date);
        const weekEnd = new Date(this.weekDays[6].date);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);

        this.dayShifts = shiftsArray
          .map(shift => this.mapApiShiftToDayShift(shift))
          .filter(shift => {
            const d = new Date(shift.date);
            return d >= weekStart && d <= weekEnd;
          });

        this.updateWeekFromShifts();
      },
      error: () => {
        // В случае ошибки просто не показываем смены, UI останется с заглушками
      }
    });
  }

  private updateWeekFromShifts(): void {
    this.weekDays = this.weekDays.map(day => {
      const shift = this.dayShifts.find(s => s.date === day.date);
      return {
        ...day,
        hasShift: !!shift && shift.type !== 'day_off',
        shiftType: shift ? shift.type : 'none'
      };
    });

    if (this.selectedDay) {
      const updated = this.weekDays.find(d => d.date === this.selectedDay!.date);
      this.selectedDay = updated || this.weekDays[0] || null;
      if (this.selectedDay) {
        this.selectedDay.isSelected = true;
      }
    }
  }

  private mapApiShiftToDayShift(shift: ApiShift): DayShift {
    let dateStr: string;
    try {
      const dateObj = new Date(shift.date);
      if (isNaN(dateObj.getTime())) {
        dateStr = new Date().toISOString().split('T')[0];
      } else {
        dateStr = dateObj.toISOString().split('T')[0];
      }
    } catch {
      dateStr = new Date().toISOString().split('T')[0];
    }

    return {
      date: dateStr,
      type: shift.type as DayShift['type'],
      startTime: shift.startTime || undefined,
      endTime: shift.endTime || undefined,
      coworkers: []
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const dayOfWeek = result.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // сделать понедельник первым
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private capitalizeFirstLetter(value: string): string {
    if (!value) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

