// src/app/components/mobile-schedule/mobile-schedule.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Day {
  date: string;
  dayNumber: number;
  dayName: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
}

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'sick' | 'regular' | 'vacation';
  status: string;
}

interface TimeSlot {
  label: string;
  timeRange: string;
  isSelected: boolean;
}

@Component({
  selector: 'app-mobile-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mobile-schedule">
      <!-- Header -->
      <header class="header">
        <h1>Привет, Мария! 👋</h1>
      </header>

      <!-- Calendar -->
      <div class="calendar-section">
        <div class="calendar-header">
          <button class="nav-btn" (click)="previousMonth()">‹</button>
          <span class="month-title">{{ monthYearDisplay }}</span>
          <button class="nav-btn" (click)="nextMonth()">›</button>
        </div>

        <div class="weekdays">
          <div class="weekday-label" *ngFor="let day of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']">
            {{ day }}
          </div>
        </div>

        <div class="calendar-grid">
          <button 
            *ngFor="let day of calendarDays" 
            class="day-cell"
            [class.other-month]="!day.isCurrentMonth"
            [class.selected]="day.isSelected"
            [class.has-shift]="hasShift(day.date)"
            [class.sick-day]="getShiftType(day.date) === 'sick'"
            [class.vacation-day]="getShiftType(day.date) === 'vacation'"
            (click)="selectDay(day)">
            {{ day.dayNumber }}
          </button>
        </div>
      </div>

      <!-- Shifts List -->
      <div class="shifts-section">
        <div class="shift-item" *ngFor="let shift of shifts">
          <div class="shift-date">{{ formatShiftDate(shift.date) }}</div>
          <div class="shift-details">
            <span class="shift-time" *ngIf="shift.type === 'regular'">
              {{ shift.startTime }} – {{ shift.endTime }}
            </span>
            <span class="shift-type"
                  [class.type-sick]="shift.type === 'sick'"
                  [class.type-vacation]="shift.type === 'vacation'">
              {{ shift.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Availability Section -->
      <div class="availability-section">
        <h2 class="section-title">Укажите желаемые часы работы</h2>
        <p class="section-subtitle">Укажите, когда именно Вы можете работать</p>

        <div class="date-slots" *ngFor="let date of upcomingDates">
          <div class="date-header">{{ date.label }}</div>
          
          <div class="time-slots">
            <button 
              *ngFor="let slot of date.timeSlots"
              class="time-slot"
              [class.selected]="slot.isSelected"
              (click)="toggleTimeSlot(date, slot)">
              <div class="slot-icon">
                <svg *ngIf="slot.label === 'Утро'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg *ngIf="slot.label === 'День'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg *ngIf="slot.label === 'Вечер'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <div class="slot-info">
                <div class="slot-label">{{ slot.label }}</div>
                <div class="slot-time">{{ slot.timeRange }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="save-section">
        <button class="save-btn" (click)="saveAvailability()">
          Сохранить доступность
        </button>
      </div>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <button class="nav-item active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
        <button class="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button class="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="20" x2="12" y2="10"/>
            <line x1="18" y1="20" x2="18" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="16"/>
          </svg>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    .mobile-schedule {
      min-height: 100vh;
      background: #FAFAFA;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding-bottom: 80px;
    }

    /* Header */
    .header {
      padding: 20px 20px 16px;
      background: white;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }

    /* Calendar Section */
    .calendar-section {
      background: white;
      padding: 20px;
      margin-bottom: 12px;
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .month-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .nav-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #E5E5E5;
      background: white;
      border-radius: 8px;
      font-size: 20px;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 8px;
    }

    .weekday-label {
      text-align: center;
      font-size: 12px;
      color: #999;
      font-weight: 500;
      padding: 8px 0;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .day-cell {
      aspect-ratio: 1;
      border: none;
      background: #F5F5F5;
      border-radius: 12px;
      font-size: 14px;
      color: #1a1a1a;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
      position: relative;
    }

    .day-cell.other-month {
      color: #CCC;
    }

    .day-cell.selected {
      background: #A8D5FF;
      color: #1a1a1a;
    }

    .day-cell.has-shift::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #666;
    }

    .day-cell.sick-day {
      background: #FFB8B8;
      color: #8B2E2E;
    }

    .day-cell.vacation-day {
      background: #FFB8B8;
      color: #8B2E2E;
    }

    .day-cell:active {
      transform: scale(0.95);
    }

    /* Shifts Section */
    .shifts-section {
      background: white;
      padding: 16px 20px;
      margin-bottom: 12px;
    }

    .shift-item {
      padding: 12px 0;
      border-bottom: 1px solid #F5F5F5;
    }

    .shift-item:last-child {
      border-bottom: none;
    }

    .shift-date {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }

    .shift-details {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .shift-time {
      font-size: 14px;
      color: #1a1a1a;
      font-weight: 500;
    }

    .shift-type {
      font-size: 13px;
      color: #8B4513;
      font-weight: 500;
    }

    .shift-type.type-sick,
    .shift-type.type-vacation {
      color: #8B2E2E;
    }

    /* Availability Section */
    .availability-section {
      background: white;
      padding: 20px;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 6px 0;
    }

    .section-subtitle {
      font-size: 13px;
      color: #999;
      margin: 0 0 20px 0;
    }

    .date-slots {
      margin-bottom: 24px;
    }

    .date-slots:last-child {
      margin-bottom: 0;
    }

    .date-header {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
    }

    .time-slots {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .time-slot {
      border: 1.5px solid #E5E5E5;
      background: white;
      border-radius: 12px;
      padding: 12px 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .time-slot:active {
      transform: scale(0.95);
    }

    .time-slot.selected {
      background: #FFE4D1;
      border-color: #FF8C42;
    }

    .slot-icon {
      width: 24px;
      height: 24px;
      color: #666;
    }

    .time-slot.selected .slot-icon {
      color: #FF8C42;
    }

    .slot-info {
      text-align: center;
    }

    .slot-label {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 2px;
    }

    .slot-time {
      font-size: 11px;
      color: #999;
    }

    /* Save Section */
    .save-section {
      padding: 0 20px 20px;
    }

    .save-btn {
      width: 100%;
      padding: 16px;
      border: none;
      background: #FF8C42;
      color: white;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .save-btn:active {
      transform: scale(0.98);
      background: #FF7A2E;
    }

    /* Bottom Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: white;
      border-top: 1px solid #E5E5E5;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 20px;
      z-index: 100;
    }

    .nav-item {
      width: 48px;
      height: 48px;
      border: none;
      background: transparent;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #999;
      transition: all 0.2s;
    }

    .nav-item.active {
      background: #FFE4D1;
      color: #FF8C42;
    }

    .nav-item:active {
      transform: scale(0.9);
    }

    /* Safe area insets for iOS */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .bottom-nav {
        padding-bottom: env(safe-area-inset-bottom);
        height: calc(70px + env(safe-area-inset-bottom));
      }
    }
  `]
})
export class MobileScheduleComponent implements OnInit {
  currentDate = new Date(2025, 10, 1); // Ноябрь 2025
  calendarDays: Day[] = [];
  monthYearDisplay = '';

  shifts: Shift[] = [
    { id: '1', date: '2025-11-20', startTime: '08:00', endTime: '18:00', type: 'regular', status: 'Смена' },
    { id: '2', date: '2025-11-21', startTime: '14:00', endTime: '22:00', type: 'regular', status: 'Смена' },
    { id: '3', date: '2025-11-22', startTime: '08:00', endTime: '18:00', type: 'regular', status: 'Смена' },
    { id: '4', date: '2025-11-24', startTime: '', endTime: '', type: 'sick', status: 'Больничный' },
    { id: '5', date: '2025-11-25', startTime: '', endTime: '', type: 'vacation', status: 'Отпуск' }
  ];

  upcomingDates = [
    {
      label: 'Понедельник, 27 ноября',
      date: '2025-11-27',
      timeSlots: [
        { label: 'Утро', timeRange: '(8 - 12)', isSelected: false },
        { label: 'День', timeRange: '(13 - 17)', isSelected: false },
        { label: 'Вечер', timeRange: '(18 - 22)', isSelected: false }
      ]
    },
    {
      label: 'Вторник, 28 ноября',
      date: '2025-11-28',
      timeSlots: [
        { label: 'Утро', timeRange: '(8 - 12)', isSelected: false },
        { label: 'День', timeRange: '(13 - 17)', isSelected: false },
        { label: 'Вечер', timeRange: '(18 - 22)', isSelected: false }
      ]
    },
    {
      label: 'Среда, 29 ноября',
      date: '2025-11-29',
      timeSlots: [
        { label: 'Утро', timeRange: '(8 - 12)', isSelected: false },
        { label: 'День', timeRange: '(13 - 17)', isSelected: false },
        { label: 'Вечер', timeRange: '(18 - 22)', isSelected: false }
      ]
    },
    {
      label: 'Четверг, 30 ноября',
      date: '2025-11-30',
      timeSlots: [
        { label: 'Утро', timeRange: '(8 - 12)', isSelected: false },
        { label: 'День', timeRange: '(13 - 17)', isSelected: false },
        { label: 'Вечер', timeRange: '(18 - 22)', isSelected: false }
      ]
    }
  ];

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    this.calendarDays = [];
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Начинаем с понедельника
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    // Добавляем дни предыдущего месяца
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      this.calendarDays.push({
        date: this.formatDate(date),
        dayNumber: date.getDate(),
        dayName: '',
        isCurrentMonth: false,
        isSelected: false
      });
    }
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        date: this.formatDate(date),
        dayNumber: i,
        dayName: '',
        isCurrentMonth: true,
        isSelected: i === 24 // Выбран 24-й день
      });
    }
    
    // Добавляем дни следующего месяца
    const remainingDays = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        date: this.formatDate(date),
        dayNumber: i,
        dayName: '',
        isCurrentMonth: false,
        isSelected: false
      });
    }
    
    this.updateMonthDisplay();
  }

  updateMonthDisplay() {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    this.monthYearDisplay = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectDay(day: Day) {
    if (!day.isCurrentMonth) return;
    
    this.calendarDays.forEach(d => d.isSelected = false);
    day.isSelected = true;
  }

  hasShift(date: string): boolean {
    return this.shifts.some(shift => shift.date === date);
  }

  getShiftType(date: string): string | null {
    const shift = this.shifts.find(s => s.date === date);
    return shift ? shift.type : null;
  }

  formatShiftDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const month = months[date.getMonth()];
    
    return `${dayName}, ${day} ${month}`;
  }

  toggleTimeSlot(date: any, slot: TimeSlot) {
    slot.isSelected = !slot.isSelected;
  }

  saveAvailability() {
    console.log('Сохранение доступности...');
    
    const availability = this.upcomingDates.map(date => ({
      date: date.date,
      slots: date.timeSlots
        .filter(slot => slot.isSelected)
        .map(slot => slot.label)
    })).filter(d => d.slots.length > 0);
    
    console.log('Выбранная доступность:', availability);
    alert('Доступность сохранена!');
  }
}