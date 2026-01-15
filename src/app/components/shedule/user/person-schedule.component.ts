// src/app/components/shedule/user/person-schedule.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShiftService, Shift as ApiShift } from '../../../services/shift.service';
import { WishService, WishCreate } from '../../../services/wish.service';
import { AuthService, User } from '../../../services/auth.service';

interface Shift {
  date: string;
  startTime: string;
  endTime: string;
  type: 'sick_leave' | 'work' | 'vacation' | 'day_off';
  status: string;
}

interface Day {
  date: string;
  dayNumber: number;
  dayName: string;
}

interface TimePreference {
  day: string;
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-person-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './person-schedule.component.html',
  styleUrls: ['./person-schedule.component.scss']
})
export class PersonScheduleComponent implements OnInit {
  // Сервисы
  private shiftService = inject(ShiftService);
  private wishService = inject(WishService);
  private authService = inject(AuthService);

  // Состояние
  isLoading = false;
  errorMessage = '';
  
  currentDate = new Date();
  weekDays: Day[] = [];
  weekRangeDisplay = '';
  currentView: 'my' | 'all' = 'my';
  
  // Данные пользователя
  currentUser: User | null = null;
  employeeName = '';
  coffeeShopName = '';
  userCoffeeShopId = '';

  // Смены и пожелания
  myShifts: Shift[] = [];
  preferencesDays: TimePreference[] = [];

  ngOnInit() {
    console.log('=== PersonScheduleComponent initialized ===');
    console.log('Initial current date:', this.currentDate.toISOString().split('T')[0]);
    
    this.loadUserData();
    this.updateWeekDays();
    this.initializePreferences(); // ← Добавили инициализацию пожеланий
  }

  /**
   * Загрузка данных пользователя
   */
  loadUserData() {
    this.currentUser = this.authService.getCurrentUserValue();
    console.log('Current user:', this.currentUser);
    
    if (!this.currentUser) {
      this.errorMessage = 'Пользователь не авторизован';
      return;
    }

    this.employeeName = this.currentUser.fullName;
    
    // Извлекаем информацию о кофейне
    if (typeof this.currentUser.coffeeShop === 'string') {
      this.userCoffeeShopId = this.currentUser.coffeeShop;
      this.coffeeShopName = 'Simple Coffee';
    } else if (this.currentUser.coffeeShop) {
      this.userCoffeeShopId = (this.currentUser.coffeeShop as any)._id;
      this.coffeeShopName = (this.currentUser.coffeeShop as any).name || 
                           (this.currentUser.coffeeShop as any).address || 
                           'Simple Coffee';
    }

    console.log('Coffee shop:', this.coffeeShopName, this.userCoffeeShopId);
  }

  /**
   * Загрузка смен текущего пользователя
   */
  loadMyShifts() {
    if (!this.currentUser || this.weekDays.length === 0) {
      console.log('Cannot load shifts: no user or no weekDays');
      return;
    }

    this.isLoading = true;
    
    const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
    const weekStart = this.weekDays[0].date;
    const weekEnd = this.weekDays[6].date;
    
    console.log('=== Loading shifts ===');
    console.log('User ID:', userId);
    console.log('Week range:', weekStart, 'to', weekEnd);
    console.log('Request params:', {
      user: userId,
      dateFrom: weekStart
    });
    
    this.shiftService.getShifts({
      user: userId,
      dateFrom: weekStart
    }).subscribe({
      next: (response: any) => {
        console.log('=== Shifts response received ===');
        console.log('Raw response:', response);
        
        // Проверяем различные варианты структуры ответа
        let shiftsArray: ApiShift[] = [];
        
        if (Array.isArray(response)) {
          shiftsArray = response;
        } else if (response?.data && Array.isArray(response.data.shifts)) {
          shiftsArray = response.data.shifts;
        } else if (Array.isArray(response?.shifts)) {
          shiftsArray = response.shifts;
        } else if (Array.isArray(response?.data)) {
          shiftsArray = response.data;
        } else {
          console.warn('Unexpected response structure:', response);
        }
        
        console.log('Extracted shifts array:', shiftsArray);
        console.log('Number of shifts:', shiftsArray.length);
        
        // Маппим смены
        this.myShifts = shiftsArray.map((shift: ApiShift) => {
          const mapped = this.mapApiShiftToShift(shift);
          console.log('Mapped shift:', {
            original_date: shift.date,
            mapped_date: mapped.date,
            type: mapped.type,
            time: `${mapped.startTime}-${mapped.endTime}`
          });
          return mapped;
        });
        
        console.log('=== Final mapped shifts ===');
        this.myShifts.forEach(shift => {
          console.log(`Date: ${shift.date}, Type: ${shift.type}, Time: ${shift.startTime}-${shift.endTime}`);
        });
        
        // Проверяем все даты текущей недели
        console.log('=== Checking shifts for current week ===');
        this.weekDays.forEach(day => {
          const shift = this.myShifts.find(s => s.date === day.date);
          console.log(`${day.date} (${day.dayName}): ${shift ? shift.type : 'NO SHIFT'}`);
        });
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('=== Error loading shifts ===');
        console.error('Error:', error);
        this.errorMessage = 'Не удалось загрузить смены';
        this.isLoading = false;
      }
    });
  }

  /**
   * Маппинг API Shift -> UI Shift
   */
  private mapApiShiftToShift(shift: ApiShift): Shift {
    // Безопасное преобразование даты
    let dateStr: string;
    try {
      const dateObj = new Date(shift.date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date for shift:', shift);
        dateStr = new Date().toISOString().split('T')[0];
      } else {
        // Используем UTC дату для избежания проблем с таймзонами
        dateStr = dateObj.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing shift date:', error, shift);
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    return {
      date: dateStr,
      startTime: shift.startTime || '08:00',
      endTime: shift.endTime || '16:00',
      type: shift.type,
      status: this.getShiftLabel(shift.type)
    };
  }

  /**
   * Инициализация пожеланий для следующей недели
   */
  initializePreferences() {
    const nextWeekStart = new Date(this.currentDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    this.preferencesDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextWeekStart);
      date.setDate(date.getDate() + i);
      
      const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const dayName = dayNames[date.getDay()];
      const dayLabel = `${dayName}, ${date.getDate()} ${date.toLocaleDateString('ru-RU', { month: 'long' })}`;
      
      this.preferencesDays.push({
        day: dayLabel,
        date: this.formatDate(date),
        startTime: '08:00',
        endTime: '16:00'
      });
    }
  }

 /**
 * Сохранение пожеланий
 */
savePreferences() {
  if (!this.currentUser) {
    alert('Ошибка: пользователь не авторизован');
    return;
  }

  const coffeeShopId = this.userCoffeeShopId;
  
  if (!coffeeShopId) {
    alert('Ошибка: не указана кофейня');
    return;
  }

  // Предупреждаем пользователя
  const confirmMessage = 'Сохранить пожелания на следующую неделю?\n\nЕсли пожелания уже существуют, они будут пропущены.';
  
  if (!confirm(confirmMessage)) {
    return;
  }

  this.isLoading = true;
  let savedCount = 0;
  let skippedCount = 0;
  let errors: string[] = [];
  const totalPreferences = this.preferencesDays.length;

  this.preferencesDays.forEach(pref => {
    const wishData: WishCreate = {
      date: pref.date,
      type: 'work',
      startTime: pref.startTime,
      endTime: pref.endTime,
      coffeeShop: coffeeShopId
    };

    console.log('=== Saving wish ===');
    console.log('Wish data:', wishData);

    this.wishService.createWish(wishData).subscribe({
      next: (response) => {
        console.log('✓ Wish saved successfully:', response);
        savedCount++;
        
        if (savedCount + skippedCount === totalPreferences) {
          this.isLoading = false;
          
          let message = `Успешно сохранено: ${savedCount}`;
          if (skippedCount > 0) {
            message += `\nПропущено (уже существуют): ${skippedCount}`;
          }
          if (errors.length > 0) {
            message += `\n\nОшибки:\n${errors.join('\n')}`;
          }
          
          alert(message);
        }
      },
      error: (error: any) => {
        console.error('✗ Ошибка сохранения пожелания');
        console.error('Error:', error.error);
        
        // Проверяем, является ли это ошибкой дубликата
        if (error.error?.message?.includes('E11000 duplicate key')) {
          console.log('⚠️ Пожелание уже существует, пропускаем');
          skippedCount++;
        } else {
          const errorMsg = error.error?.message || error.message || 'Неизвестная ошибка';
          errors.push(`${pref.day}: ${errorMsg}`);
        }
        
        if (savedCount + skippedCount + errors.length === totalPreferences) {
          this.isLoading = false;
          
          let message = `Успешно сохранено: ${savedCount}`;
          if (skippedCount > 0) {
            message += `\nПропущено (уже существуют): ${skippedCount}`;
          }
          if (errors.length > 0) {
            message += `\n\nОшибки:\n${errors.join('\n')}`;
          }
          
          alert(message);
        }
      }
    });
  });
}

  /**
   * Сброс пожеланий
   */
  resetPreferences() {
    if (confirm('Вы уверены, что хотите сбросить все пожелания?')) {
      this.initializePreferences();
    }
  }

  /**
   * Обновление недели
   */
  updateWeekDays() {
    console.log('=== updateWeekDays called ===');
    console.log('Current date:', this.currentDate.toISOString().split('T')[0]);
    
    this.weekDays = [];
    
    // Находим понедельник ТЕКУЩЕЙ недели
    const startDate = new Date(this.currentDate);
    const dayOfWeek = startDate.getDay();
    
    // Корректируем для начала недели (понедельник)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

    console.log('Week start (Monday):', startDate.toISOString().split('T')[0]);

    // Создаем 7 дней начиная с понедельника
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i];
      
      this.weekDays.push({
        date: this.formatDate(date),
        dayNumber: date.getDate(),
        dayName: dayName
      });
    }

    console.log('=== Week days generated ===');
    this.weekDays.forEach((day, index) => {
      console.log(`${index}: ${day.dayName} ${day.dayNumber} (${day.date})`);
    });

    this.updateWeekDisplay();
    
    // Перезагружаем смены если пользователь уже загружен
    if (this.currentUser) {
      console.log('User is loaded, fetching shifts...');
      this.loadMyShifts();
    } else {
      console.log('User not loaded yet, skipping shift fetch');
    }
  }

  updateWeekDisplay() {
    if (this.weekDays.length === 0) return;
    
    const startDate = new Date(this.weekDays[0].date);
    const endDate = new Date(this.weekDays[6].date);
    
    const startStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const endStr = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    this.weekRangeDisplay = `${startStr} - ${endStr} г.`;
    console.log('Week range display:', this.weekRangeDisplay);
  }

  /**
   * Переход на предыдущую неделю
   */
  previousWeek() {
    console.log('=== previousWeek called ===');
    console.log('Before:', this.currentDate.toISOString().split('T')[0]);
    
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    
    console.log('After:', this.currentDate.toISOString().split('T')[0]);
    this.updateWeekDays();
  }

  /**
   * Переход на следующую неделю
   */
  nextWeek() {
    console.log('=== nextWeek called ===');
    console.log('Before:', this.currentDate.toISOString().split('T')[0]);
    
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    
    console.log('After:', this.currentDate.toISOString().split('T')[0]);
    this.updateWeekDays();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMyShift(date: string): Shift | undefined {
    const shift = this.myShifts.find(s => s.date === date);
    if (shift) {
      console.log(`Found shift for ${date}:`, shift);
    } else {
      console.log(`No shift found for ${date}`);
    }
    return shift;
  }

  getShiftLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'work': 'Смена',
      'sick_leave': 'Больничный',
      'vacation': 'Отпуск',
      'day_off': 'Выходной'
    };
    return labels[type] || '';
  }

  calculateHours(startTime: string, endTime: string): number {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    return endHour - startHour;
  }

  /**
   * Управление временем в пожеланиях
   */
  incrementStartTime(index: number) {
    const currentTime = this.preferencesDays[index].startTime;
    const [hours, minutes] = currentTime.split(':').map(Number);
    
    let newHours = hours;
    let newMinutes = minutes + 30;
    
    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = (newHours + 1) % 24;
    }
    
    this.preferencesDays[index].startTime = 
      `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  decrementStartTime(index: number) {
    const currentTime = this.preferencesDays[index].startTime;
    const [hours, minutes] = currentTime.split(':').map(Number);
    
    let newHours = hours;
    let newMinutes = minutes - 30;
    
    if (newMinutes < 0) {
      newMinutes = 30;
      newHours = (newHours - 1 + 24) % 24;
    }
    
    this.preferencesDays[index].startTime = 
      `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  incrementEndTime(index: number) {
    const currentTime = this.preferencesDays[index].endTime;
    const [hours, minutes] = currentTime.split(':').map(Number);
    
    let newHours = hours;
    let newMinutes = minutes + 30;
    
    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = (newHours + 1) % 24;
    }
    
    this.preferencesDays[index].endTime = 
      `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  decrementEndTime(index: number) {
    const currentTime = this.preferencesDays[index].endTime;
    const [hours, minutes] = currentTime.split(':').map(Number);
    
    let newHours = hours;
    let newMinutes = minutes - 30;
    
    if (newMinutes < 0) {
      newMinutes = 30;
      newHours = (newHours - 1 + 24) % 24;
    }
    
    this.preferencesDays[index].endTime = 
      `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  /**
   * Экспорт расписания
   */
  exportSchedule() {
    alert('Функция экспорта в разработке');
  }
}