// src/app/components/schedule/user/person-schedule.component.ts
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

interface TeamMember {
  id: string;
  name: string;
  isCurrentUser: boolean;
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
  
  // НОВОЕ: Данные команды
  teamMembers: TeamMember[] = [];
  teamShifts: Map<string, Shift[]> = new Map();

  ngOnInit() {
    console.log('=== PersonScheduleComponent initialized ===');
    console.log('Initial current date:', this.currentDate.toISOString().split('T')[0]);
    
    this.loadUserData();
    this.updateWeekDays();
    this.initializePreferences();
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
    
    // НОВОЕ: Загружаем команду
    this.loadTeamMembers();
  }

  /**
   * НОВОЕ: Загрузка команды через смены (у бариста нет доступа к /users)
   */
  loadTeamMembers() {
    if (!this.userCoffeeShopId) {
      console.log('Cannot load team: no coffee shop ID');
      return;
    }

    console.log('=== Loading team members via shifts ===');
    console.log('Coffee shop ID:', this.userCoffeeShopId);
    
    // Загружаем смены за текущий месяц чтобы получить список всех сотрудников
    const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const dateFrom = this.formatDate(startOfMonth);
    
    console.log('Loading shifts from:', dateFrom);
    
    this.shiftService.getShifts({
      coffeeShop: this.userCoffeeShopId,
      dateFrom: dateFrom
    }).subscribe({
      next: (response: any) => {
        console.log('=== Shifts for team discovery ===');
        
        let shiftsArray: any[] = [];
        
        if (Array.isArray(response)) {
          shiftsArray = response;
        } else if (response?.data && Array.isArray(response.data.shifts)) {
          shiftsArray = response.data.shifts;
        } else if (Array.isArray(response?.shifts)) {
          shiftsArray = response.shifts;
        } else if (Array.isArray(response?.data)) {
          shiftsArray = response.data;
        }
        
        console.log('Total shifts found:', shiftsArray.length);
        
        // Извлекаем уникальных пользователей из смен
        const userMap = new Map<string, TeamMember>();
        const currentUserId = (this.currentUser as any)?._id || (this.currentUser as any)?.id;
        
        shiftsArray.forEach(shift => {
          let userId: string;
          let userName: string;
          
          if (typeof shift.user === 'string') {
            userId = shift.user;
            userName = userId === currentUserId ? this.employeeName : 'Сотрудник';
          } else if (shift.user) {
            userId = shift.user._id;
            userName = shift.user.fullName || 'Сотрудник';
          } else {
            return;
          }
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              id: userId,
              name: userName,
              isCurrentUser: userId === currentUserId
            });
          }
        });
        
        this.teamMembers = Array.from(userMap.values())
          .sort((a, b) => {
            if (a.isCurrentUser) return -1;
            if (b.isCurrentUser) return 1;
            return a.name.localeCompare(b.name);
          });
        
        console.log('Team members extracted:', this.teamMembers);
        
        // Теперь загружаем смены для текущей недели
        if (this.weekDays.length > 0) {
          this.loadTeamShifts();
        }
      },
      error: (error: any) => {
        console.error('Error loading team members via shifts:', error);
        
        // Если не удалось загрузить, добавляем хотя бы текущего пользователя
        const currentUserId = (this.currentUser as any)?._id || (this.currentUser as any)?.id;
        this.teamMembers = [{
          id: currentUserId,
          name: this.employeeName,
          isCurrentUser: true
        }];
      }
    });
  }

  /**
   * НОВОЕ: Загрузка смен всей команды
   */
  loadTeamShifts() {
    if (this.teamMembers.length === 0 || this.weekDays.length === 0) {
      console.log('Cannot load team shifts: no team or no weekDays');
      return;
    }

    const weekStart = this.weekDays[0].date;
    
    console.log('=== Loading team shifts ===');
    console.log('Week start:', weekStart);
    console.log('Coffee shop:', this.userCoffeeShopId);
    
    this.shiftService.getShifts({
      coffeeShop: this.userCoffeeShopId,
      dateFrom: weekStart
    }).subscribe({
      next: (response: any) => {
        console.log('=== Team shifts response ===');
        console.log('Response:', response);
        
        let shiftsArray: any[] = [];
        
        if (Array.isArray(response)) {
          shiftsArray = response;
        } else if (response?.data && Array.isArray(response.data.shifts)) {
          shiftsArray = response.data.shifts;
        } else if (Array.isArray(response?.shifts)) {
          shiftsArray = response.shifts;
        } else if (Array.isArray(response?.data)) {
          shiftsArray = response.data;
        }
        
        console.log('Total shifts loaded:', shiftsArray.length);
        
        // Группируем смены по пользователям
        this.teamShifts.clear();
        
        shiftsArray.forEach(shift => {
          const userId = typeof shift.user === 'string' ? shift.user : shift.user?._id;
          
          if (!userId) {
            console.warn('Shift without user ID:', shift);
            return;
          }
          
          if (!this.teamShifts.has(userId)) {
            this.teamShifts.set(userId, []);
          }
          
          this.teamShifts.get(userId)!.push(this.mapApiShiftToShift(shift));
        });
        
        console.log('Team shifts grouped by user:');
        this.teamShifts.forEach((shifts, userId) => {
          const member = this.teamMembers.find(m => m.id === userId);
          console.log(`${member?.name || userId}: ${shifts.length} shifts`);
        });
      },
      error: (error: any) => {
        console.error('Error loading team shifts:', error);
      }
    });
  }

  /**
   * НОВОЕ: Получить смену члена команды на конкретную дату
   */
  getTeamMemberShift(userId: string, date: string): Shift | undefined {
    const shifts = this.teamShifts.get(userId);
    return shifts?.find(s => s.date === date);
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
    
    console.log('=== Loading my shifts ===');
    console.log('User ID:', userId);
    console.log('Week start:', weekStart);
    
    this.shiftService.getShifts({
      user: userId,
      dateFrom: weekStart
    }).subscribe({
      next: (response: any) => {
        console.log('=== Shifts response received ===');
        console.log('Raw response:', response);
        
        let shiftsArray: ApiShift[] = [];
        
        if (Array.isArray(response)) {
          shiftsArray = response;
        } else if (response?.data && Array.isArray(response.data.shifts)) {
          shiftsArray = response.data.shifts;
        } else if (Array.isArray(response?.shifts)) {
          shiftsArray = response.shifts;
        } else if (Array.isArray(response?.data)) {
          shiftsArray = response.data;
        }
        
        console.log('Number of shifts:', shiftsArray.length);
        
        this.myShifts = shiftsArray.map(shift => this.mapApiShiftToShift(shift));
        
        console.log('=== Mapped shifts ===');
        this.myShifts.forEach(shift => {
          console.log(`${shift.date}: ${shift.type} (${shift.startTime}-${shift.endTime})`);
        });
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading shifts:', error);
        this.errorMessage = 'Не удалось загрузить смены';
        this.isLoading = false;
      }
    });
  }

  /**
   * Маппинг API Shift -> UI Shift
   */
  private mapApiShiftToShift(shift: ApiShift): Shift {
    let dateStr: string;
    try {
      const dateObj = new Date(shift.date);
      if (isNaN(dateObj.getTime())) {
        dateStr = new Date().toISOString().split('T')[0];
      } else {
        dateStr = dateObj.toISOString().split('T')[0];
      }
    } catch (error) {
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

      this.wishService.createWish(wishData).subscribe({
        next: () => {
          savedCount++;
          
          if (savedCount + skippedCount + errors.length === totalPreferences) {
            this.showSaveResult(savedCount, skippedCount, errors);
          }
        },
        error: (error: any) => {
          if (error.error?.message?.includes('E11000 duplicate key')) {
            skippedCount++;
          } else {
            const errorMsg = error.error?.message || error.message || 'Неизвестная ошибка';
            errors.push(`${pref.day}: ${errorMsg}`);
          }
          
          if (savedCount + skippedCount + errors.length === totalPreferences) {
            this.showSaveResult(savedCount, skippedCount, errors);
          }
        }
      });
    });
  }

  private showSaveResult(savedCount: number, skippedCount: number, errors: string[]) {
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
    this.weekDays = [];
    
    const startDate = new Date(this.currentDate);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

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

    this.updateWeekDisplay();
    
    if (this.currentUser) {
      this.loadMyShifts();
      
      // НОВОЕ: Загружаем смены команды если уже есть список команды
      if (this.teamMembers.length > 0) {
        this.loadTeamShifts();
      }
    }
  }

  updateWeekDisplay() {
    if (this.weekDays.length === 0) return;
    
    const startDate = new Date(this.weekDays[0].date);
    const endDate = new Date(this.weekDays[6].date);
    
    const startStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const endStr = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    this.weekRangeDisplay = `${startStr} - ${endStr} г.`;
  }

  previousWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.updateWeekDays();
  }

  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.updateWeekDays();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMyShift(date: string): Shift | undefined {
    return this.myShifts.find(s => s.date === date);
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

  // Методы управления временем в пожеланиях
  incrementStartTime(index: number) {
    const time = this.preferencesDays[index].startTime.split(':').map(Number);
    let [h, m] = time;
    m += 30;
    if (m >= 60) { m = 0; h = (h + 1) % 24; }
    this.preferencesDays[index].startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  decrementStartTime(index: number) {
    const time = this.preferencesDays[index].startTime.split(':').map(Number);
    let [h, m] = time;
    m -= 30;
    if (m < 0) { m = 30; h = (h - 1 + 24) % 24; }
    this.preferencesDays[index].startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  incrementEndTime(index: number) {
    const time = this.preferencesDays[index].endTime.split(':').map(Number);
    let [h, m] = time;
    m += 30;
    if (m >= 60) { m = 0; h = (h + 1) % 24; }
    this.preferencesDays[index].endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  decrementEndTime(index: number) {
    const time = this.preferencesDays[index].endTime.split(':').map(Number);
    let [h, m] = time;
    m -= 30;
    if (m < 0) { m = 30; h = (h - 1 + 24) % 24; }
    this.preferencesDays[index].endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  exportSchedule() {
    alert('Функция экспорта в разработке');
  }
}