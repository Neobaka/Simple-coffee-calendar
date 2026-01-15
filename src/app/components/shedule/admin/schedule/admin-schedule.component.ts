// src/app/components/shedule/admin/schedule/admin-schedule.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShiftService, Shift as ApiShift } from '../../../../services/shift.service';
import { UserService, User as ApiUser } from '../../../../services/user.service';
import { WishService, Wish as ApiWish } from '../../../../services/wish.service';
import { AuthService } from '../../../../services/auth.service';
import { forkJoin } from 'rxjs';

// Интерфейсы для UI
interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'sick_leave' | 'work' | 'vacation';
  status: string;
  hourlyRate?: number;
}

interface Employee {
  id: string;
  name: string;
  hourlyRate: number;
  coffeeShop?: string;
}

interface CoffeeShop {
  id: string;
  name: string;
}

interface Day {
  date: string;
  dayNumber: number;
  dayName: string;
  isCurrentMonth: boolean;
}

interface ShiftRequest {
  id: string;
  date: string;
  requesterName: string;
  requestType: string;
  replacementName: string;
  comment: string;
}

interface GanttWish {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  startHour: number;
  duration: number;
  selected: boolean;
}

interface WishRequest {
  id: string;
  employeeName: string;
  date: string;
  dateFormatted: string;
  type: string;
  typeLabel: string;
  startTime?: string;
  endTime?: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-schedule.component.html',
  styleUrls: ['./admin-schedule.component.scss']
})
export class AdminScheduleComponent implements OnInit {
  // Сервисы
  private shiftService = inject(ShiftService);
  private userService = inject(UserService);
  private wishService = inject(WishService);
  private authService = inject(AuthService);

  // Состояние загрузки
  isLoading = false;
  errorMessage = '';

  // Данные
  currentDate = new Date();
  weekDays: Day[] = [];
  nextWeekDays: Day[] = []
  pendingWishRequests: WishRequest[] = [];
  
  
  monthYearDisplay = '';
  ganttDateRange = '';
  timelineHours: string[] = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

  // UI состояние
  showAddModal = false;
  showCoffeeFilter = false;
  showTypeFilter = false;
  showEmployeeFilter = false;
  activeTab: 'requests' | 'preferences' = 'requests';

  // Фильтры
  selectedCoffeeShop: string = 'all';
  currentUserCoffeeShop: string = '';
  coffeeShops: CoffeeShop[] = [];
  selectedTypes: { [key: string]: boolean } = {
    work: true,
    sick_leave: true,
    vacation: true
  };
  selectedEmployees: { [key: string]: boolean } = {};

  // Редактирование смены
  editingShift: Shift | null = null;
  selectedEmployee: Employee | null = null;
  selectedDay: Day | null = null;

  newShift = {
    type: 'work',
    startTime: '08:00',
    endTime: '16:00',
    comment: ''
  };

  // Данные из API
  employees: Employee[] = [];
  shifts: Shift[] = [];
  shiftRequests: ShiftRequest[] = [];
  wishes: ApiWish[] = [];
  ganttWishes: GanttWish[] = [];

  ngOnInit() {
    this.updateWeekDays();
    this.loadCoffeeShops();
    this.loadInitialData();
  }

  /**
   * Загрузка списка кофеен
   */
  loadCoffeeShops() {
    this.userService.getUsers({ limit: 100 }).subscribe({
      next: (response: any) => {
        console.log('Coffee shops response:', response);
        
        const usersArray = response?.data?.users || response?.users || [];
        console.log('Users for coffee shops:', usersArray);
        
        const coffeeShopSet = new Set<string>();
        const coffeeShopMap = new Map<string, string>();
        
        usersArray.forEach((user: any) => {
          console.log('User coffee shop:', user.fullName, user.coffeeShop);
          
          if (user.coffeeShop) {
            const coffeeShopId = typeof user.coffeeShop === 'string' 
              ? user.coffeeShop 
              : user.coffeeShop._id;
            const coffeeShopName = typeof user.coffeeShop === 'string'
              ? coffeeShopId
              : user.coffeeShop.name || user.coffeeShop.address || coffeeShopId;
            
            console.log('Extracted coffee shop:', { id: coffeeShopId, name: coffeeShopName });
            
            if (!coffeeShopSet.has(coffeeShopId)) {
              coffeeShopSet.add(coffeeShopId);
              coffeeShopMap.set(coffeeShopId, coffeeShopName);
            }
          }
        });
        
        this.coffeeShops = Array.from(coffeeShopMap.entries()).map(([id, name]) => ({
          id,
          name
        }));
        
        console.log('Final coffee shops:', this.coffeeShops);
      },
      error: (error: any) => {
        console.error('Ошибка загрузки кофеен:', error);
      }
    });
  }

  /**
   * Загрузка начальных данных
   */
  loadInitialData() {
    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.authService.getCurrentUserValue();
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      this.errorMessage = 'Пользователь не авторизован';
      this.isLoading = false;
      return;
    }

    this.currentUserCoffeeShop = typeof currentUser.coffeeShop === 'string' 
      ? currentUser.coffeeShop 
      : (currentUser.coffeeShop as any)?._id || '';

    console.log('Coffee shop ID:', this.currentUserCoffeeShop);

    const userParams: any = { limit: 100 };
    const shiftParams: any = { dateFrom: this.weekDays[0]?.date || this.formatDate(this.currentDate) };
    const wishParams: any = { limit: 100 };
    
    if (this.currentUserCoffeeShop) {
      userParams.coffeeShop = this.currentUserCoffeeShop;
      shiftParams.coffeeShop = this.currentUserCoffeeShop;
      wishParams.coffeeShop = this.currentUserCoffeeShop;
    }

    forkJoin({
      users: this.userService.getUsers(userParams),
      shifts: this.shiftService.getShifts(shiftParams),
      wishes: this.wishService.getWishes(wishParams)
    }).subscribe({
      next: (data: any) => {
        console.log('Loaded data:', data);
        
        let usersArray: any[] = [];
        
        if (Array.isArray(data.users)) {
          usersArray = data.users;
        } else if (data.users?.data && Array.isArray(data.users.data.users)) {
          usersArray = data.users.data.users;
        } else if (data.users && Array.isArray(data.users.users)) {
          usersArray = data.users.users;
        } else if (data.users && Array.isArray(data.users.data)) {
          usersArray = data.users.data;
        } else {
          console.warn('Unexpected users structure:', data.users);
        }
        
        console.log('Final users array:', usersArray);
        
        this.employees = usersArray
          .filter((u: ApiUser) => u.role === 'barista' && u.isActive)
          .map((u: ApiUser) => this.mapUserToEmployee(u));

        console.log('Mapped employees:', this.employees);

        this.employees.forEach(emp => {
          this.selectedEmployees[emp.id] = true;
        });

        let shiftsArray: any[] = [];
        
        if (Array.isArray(data.shifts)) {
          shiftsArray = data.shifts;
        } else if (data.shifts?.data && Array.isArray(data.shifts.data.shifts)) {
          shiftsArray = data.shifts.data.shifts;
        } else if (data.shifts && Array.isArray(data.shifts.shifts)) {
          shiftsArray = data.shifts.shifts;
        } else if (data.shifts && Array.isArray(data.shifts.data)) {
          shiftsArray = data.shifts.data;
        } else {
          console.warn('Unexpected shifts structure:', data.shifts);
        }
        
        console.log('Final shifts array:', shiftsArray);
        
        this.shifts = shiftsArray.map((s: ApiShift) => this.mapApiShiftToShift(s, usersArray));

        console.log('Mapped shifts:', this.shifts);

        let wishesArray: any[] = [];
        
        if (Array.isArray(data.wishes)) {
          wishesArray = data.wishes;
        } else if (data.wishes?.data && Array.isArray(data.wishes.data.wishes)) {
          wishesArray = data.wishes.data.wishes;
        } else if (data.wishes && Array.isArray(data.wishes.wishes)) {
          wishesArray = data.wishes.wishes;
        } else if (data.wishes && Array.isArray(data.wishes.data)) {
          wishesArray = data.wishes.data;
        } else {
          console.warn('Unexpected wishes structure:', data.wishes);
        }
        
        console.log('Final wishes array:', wishesArray);
        
        this.wishes = wishesArray;
        
        // Преобразуем wishes в ganttWishes
        this.buildGanttWishes();
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Ошибка загрузки данных:', error);
        this.errorMessage = 'Не удалось загрузить данные. Попробуйте обновить страницу.';
        this.isLoading = false;
      }
    });
  }

 /**
 * Построение Gantt Wishes из API Wishes
 */
buildGanttWishes() {
  console.log('=== Building Gantt Wishes ===');
  console.log('Wishes:', this.wishes);
  
  // Создаем и СОХРАНЯЕМ массив дней СЛЕДУЮЩЕЙ недели
  this.nextWeekDays = this.getNextWeekDays();
  console.log('Next week days:', this.nextWeekDays);
  
  this.ganttWishes = [];
  
  this.wishes.forEach(wish => {
    const employee = this.employees.find(e => e.id === (typeof wish.user === 'string' ? wish.user : (wish.user as any)?._id));
    
    if (!employee) {
      console.warn('Employee not found for wish:', wish);
      return;
    }
    
    // ВАЖНО: Проверяем наличие времени (для больничных, отпусков и выходных времени нет)
    if (!wish.startTime || !wish.endTime) {
      console.log('Wish without time (sick_leave/vacation/day_off):', wish);
      return; // Пропускаем wishes без времени - они не для Gantt диаграммы
    }
    
    const wishDate = new Date(wish.date).toISOString().split('T')[0];
    const day = this.nextWeekDays.find(d => d.date === wishDate);
    
    if (!day) {
      console.log('Wish date not in next week:', wishDate);
      return;
    }
    
    try {
      const [startHour, startMin] = wish.startTime.split(':').map(Number);
      const [endHour, endMin] = wish.endTime.split(':').map(Number);
      
      // Проверяем корректность парсинга
      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        console.warn('Invalid time format for wish:', wish);
        return;
      }
      
      const startHourDecimal = startHour + startMin / 60;
      const endHourDecimal = endHour + endMin / 60;
      const duration = endHourDecimal - startHourDecimal;
      
      const ganttWish: GanttWish = {
        id: wish._id,
        employeeId: employee.id,
        employeeName: employee.name,
        date: wish.date,
        dayName: day.dayName,
        startTime: wish.startTime,
        endTime: wish.endTime,
        startHour: startHourDecimal,
        duration: duration,
        selected: false
      };
      
      this.ganttWishes.push(ganttWish);
      console.log('Added Gantt wish:', ganttWish);
    } catch (error) {
      console.error('Error processing wish time:', error, wish);
    }
  });
  
  console.log('Total Gantt wishes:', this.ganttWishes.length);
  
  // Обновляем диапазон дат для Gantt
  this.updateGanttDateRangeForNextWeek(this.nextWeekDays);
}

  /**
 * Получить дни следующей недели
 */
private getNextWeekDays(): Day[] {
  const nextWeekDays: Day[] = [];
  
  // Берем понедельник текущей недели и добавляем 7 дней
  const nextWeekStart = new Date(this.weekDays[0].date);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  
  console.log('Next week start:', nextWeekStart.toISOString().split('T')[0]);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(nextWeekStart);
    date.setDate(date.getDate() + i);
    
    const dayName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i];
    
    nextWeekDays.push({
      date: this.formatDate(date),
      dayNumber: date.getDate(),
      dayName: dayName,
      isCurrentMonth: date.getMonth() === this.currentDate.getMonth()
    });
  }
  
  return nextWeekDays;
}


  /**
   * Обновить диапазон дат для Gantt (следующая неделя)
   */
  private updateGanttDateRangeForNextWeek(nextWeekDays: Day[]) {
    if (nextWeekDays.length === 0) return;
    
    const startDate = new Date(nextWeekDays[0].date);
    const endDate = new Date(nextWeekDays[6].date);
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const monthName = startDate.toLocaleDateString('ru-RU', { month: 'long' });
    const year = startDate.getFullYear();
    
    this.ganttDateRange = `${startDay} ${monthName} - ${endDay} ${monthName} ${year} г.`;
    console.log('Gantt date range (next week):', this.ganttDateRange);
  }

  /**
   * Получить wishes для конкретного дня (из следующей недели)
   */
  getWishesForDay(dayName: string): GanttWish[] {
    const wishes = this.ganttWishes.filter(w => w.dayName === dayName);
    console.log(`Wishes for ${dayName}:`, wishes);
    return wishes;
  }

  /**
   * Переключить выбор wish
   */
  toggleWishSelection(wish: GanttWish) {
    wish.selected = !wish.selected;
    console.log('Wish selection toggled:', wish);
  }

  /**
   * Добавить выбранные wishes в календарь как смены
   */
  addSelectedWishesToCalendar() {
  const selectedWishes = this.ganttWishes.filter(w => w.selected);
  
  if (selectedWishes.length === 0) {
    alert('Выберите хотя бы одно пожелание для добавления в график');
    return;
  }
  
  // Показываем подтверждение с деталями
  const summary = this.getSelectedWishesSummary();
  if (!confirm(summary)) {
    return;
  }
  
  console.log('=== Adding wishes to calendar ===');
  console.log('Selected wishes:', selectedWishes);
    
    this.isLoading = true;
    let addedCount = 0;
    let errors: string[] = [];
    const totalWishes = selectedWishes.length;
    
    selectedWishes.forEach(wish => {
      const employee = this.employees.find(e => e.id === wish.employeeId);
      
      if (!employee) {
        errors.push(`Сотрудник не найден для wish ${wish.id}`);
        addedCount++;
        checkIfComplete();
        return;
      }
      
      const coffeeShopId = this.currentUserCoffeeShop || employee.coffeeShop;
      
      if (!coffeeShopId) {
        errors.push(`Не указана кофейня для ${employee.name}`);
        addedCount++;
        checkIfComplete();
        return;
      }
      
      // Создаем смену с данными из пожелания
      const shiftData = {
        user: employee.id,
        coffeeShop: coffeeShopId,
        date: wish.date,  // Используем дату из wish (это уже следующая неделя)
        type: 'work' as 'work',
        startTime: wish.startTime,  // Используем время из пожелания
        endTime: wish.endTime,      // Используем время из пожелания
        hourlyRate: employee.hourlyRate
      };
      
      console.log('Creating shift from wish:', {
        employee: employee.name,
        date: wish.date,
        time: `${wish.startTime} - ${wish.endTime}`,
        data: shiftData
      });
      
      this.shiftService.createShift(shiftData).subscribe({
        next: (newShift: any) => {
          console.log('✓ Shift created successfully:', newShift);
          
          const shiftData = newShift?.data?.shift || newShift?.shift || newShift;
          
          // Добавляем смену в локальный массив
          this.shifts.push(this.mapApiShiftToShift(shiftData, 
            this.employees.map(e => ({
              _id: e.id,
              fullName: e.name,
              hourlyRate: e.hourlyRate,
              coffeeShop: e.coffeeShop
            } as any))
          ));
          
          // Убираем wish из выбранных
          wish.selected = false;
          
          addedCount++;
          checkIfComplete();
        },
        error: (error: any) => {
          console.error('✗ Error creating shift:', error);
          
          // Проверяем, является ли это ошибкой дубликата
          if (error.error?.message?.includes('E11000 duplicate key')) {
            errors.push(`${employee.name} (${wish.date}): Смена уже существует`);
          } else {
            const errorMsg = error?.error?.message || 'Неизвестная ошибка';
            errors.push(`${employee.name} (${wish.date}): ${errorMsg}`);
          }
          
          addedCount++;
          checkIfComplete();
        }
      });
    });
    
    // Функция для проверки завершения всех запросов
    const checkIfComplete = () => {
      if (addedCount === totalWishes) {
        this.isLoading = false;
        
        const successCount = totalWishes - errors.length;
        
        let message = '';
        if (successCount > 0) {
          message += `✓ Успешно добавлено смен: ${successCount}\n`;
        }
        if (errors.length > 0) {
          message += `\n⚠ Ошибки (${errors.length}):\n${errors.join('\n')}`;
        }
        
        alert(message || 'Все смены успешно добавлены!');
        
        // Перезагружаем смены для обновления календаря
        this.loadShiftsForCurrentWeek();
        
        // Можно также переключиться на следующую неделю автоматически
        if (successCount > 0) {
          // Спросим пользователя, хочет ли он перейти на следующую неделю
          if (confirm('Смены добавлены на следующую неделю. Перейти к просмотру следующей недели?')) {
            this.nextMonth(); // Переходим на следующую неделю
          }
        }
      }
    };
  }

  /**
 * Получить краткую информацию о выбранных wishes для подтверждения
 */
private getSelectedWishesSummary(): string {
  const selected = this.ganttWishes.filter(w => w.selected);
  
  if (selected.length === 0) return '';
  
  const summary = selected.map(w => 
    `${w.employeeName}: ${w.dayName} ${w.startTime}-${w.endTime}`
  ).join('\n');
  
  return `Будут добавлены следующие смены:\n\n${summary}\n\nПродолжить?`;
}

  
  /**
   * Сбросить выбор wishes
   */
  resetGantt() {
    this.ganttWishes.forEach(w => w.selected = false);
    console.log('Gantt selection reset');
  }

  /**
   * Маппинг API User -> Employee
   */
  private mapUserToEmployee(user: ApiUser): Employee {
    return {
      id: user._id,
      name: user.fullName,
      hourlyRate: user.hourlyRate,
      coffeeShop: typeof user.coffeeShop === 'string' ? user.coffeeShop : (user.coffeeShop as any)?._id
    };
  }

  /**
   * Маппинг API Shift -> UI Shift
   */
  private mapApiShiftToShift(shift: ApiShift, users: ApiUser[]): Shift {
    const userId = typeof shift.user === 'string' ? shift.user : (shift.user as any)?._id;
    const user = users.find(u => u._id === userId);
    
    console.log('Mapping shift:', { 
      shiftUserId: userId, 
      foundUser: user?.fullName,
      allUserIds: users.map(u => u._id)
    });
    
    let dateStr: string;
    try {
      const dateObj = new Date(shift.date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date for shift:', shift);
        dateStr = new Date().toISOString().split('T')[0];
      } else {
        dateStr = dateObj.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing shift date:', error, shift);
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    return {
      id: shift._id,
      employeeId: userId,
      employeeName: user?.fullName || 'Неизвестный',
      date: dateStr,
      startTime: shift.startTime || '08:00',
      endTime: shift.endTime || '16:00',
      type: shift.type,
      status: this.getShiftLabel(shift.type),
      hourlyRate: shift.hourlyRate
    };
  }

  /**
   * Обновление календаря
   */
  updateWeekDays() {
    this.weekDays = [];
    
    const startDate = new Date(this.currentDate);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

    console.log('Week start date:', startDate.toISOString().split('T')[0]);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
      const dayName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i];
      
      this.weekDays.push({
        date: this.formatDate(date),
        dayNumber: date.getDate(),
        dayName: dayName,
        isCurrentMonth: isCurrentMonth
      });
    }

    console.log('Week days:', this.weekDays.map(d => d.date));

    this.updateMonthDisplay();
    this.updateGanttDateRange();
    
    if (this.currentUserCoffeeShop || this.employees.length > 0) {
      this.loadShiftsForCurrentWeek();
      this.loadWishesForCurrentWeek();
    }
  }

  /**
   * Загрузка смен для текущей недели
   */
  loadShiftsForCurrentWeek() {
    if (this.weekDays.length === 0) return;

    console.log('Loading shifts for week:', this.weekDays.map(d => d.date));

    const shiftParams: any = { dateFrom: this.weekDays[0].date };
    
    if (this.currentUserCoffeeShop) {
      shiftParams.coffeeShop = this.currentUserCoffeeShop;
    }

    this.shiftService.getShifts(shiftParams).subscribe({
      next: (response: any) => {
        const shiftsArray = response?.data?.shifts || response?.shifts || response || [];
        
        console.log('Reloaded shifts raw:', shiftsArray);
        
        const usersArray = this.employees.map(e => ({
          _id: e.id,
          fullName: e.name,
          hourlyRate: e.hourlyRate,
          coffeeShop: e.coffeeShop
        } as any));
        
        this.shifts = shiftsArray.map((s: ApiShift) => 
          this.mapApiShiftToShift(s, usersArray)
        );
        
        console.log('Mapped shifts:', this.shifts);
      },
      error: (error: any) => {
        console.error('Ошибка загрузки смен:', error);
      }
    });
  }

  /**
   * Загрузка wishes для текущей недели
   */
  loadWishesForCurrentWeek() {
    if (this.weekDays.length === 0) return;

    console.log('Loading wishes for week:', this.weekDays.map(d => d.date));

    const wishParams: any = { 
      dateFrom: this.weekDays[0].date,
      limit: 100 
    };
    
    if (this.currentUserCoffeeShop) {
      wishParams.coffeeShop = this.currentUserCoffeeShop;
    }

    this.wishService.getWishes(wishParams).subscribe({
      next: (response: any) => {
        let wishesArray: any[] = [];
        
        if (Array.isArray(response)) {
          wishesArray = response;
        } else if (response?.data && Array.isArray(response.data.wishes)) {
          wishesArray = response.data.wishes;
        } else if (response && Array.isArray(response.wishes)) {
          wishesArray = response.wishes;
        } else if (response && Array.isArray(response.data)) {
          wishesArray = response.data;
        }
        
        console.log('Reloaded wishes:', wishesArray);
        
        this.wishes = wishesArray;
        this.buildGanttWishes();
      },
      error: (error: any) => {
        console.error('Ошибка загрузки wishes:', error);
      }
    });
  }

  updateMonthDisplay() {
    if (this.weekDays.length === 0) return;
    
    const startDate = new Date(this.weekDays[0].date);
    const endDate = new Date(this.weekDays[6].date);
    
    const startStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const endStr = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    this.monthYearDisplay = `${startStr} - ${endStr}`;
  }

  updateGanttDateRange() {
    if (this.weekDays.length === 0) return;
    
    const startDate = new Date(this.weekDays[0].date);
    const endDate = new Date(this.weekDays[6].date);
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const monthName = startDate.toLocaleDateString('ru-RU', { month: 'long' });
    const year = startDate.getFullYear();
    
    this.ganttDateRange = `${startDay} ${monthName} - ${endDay} ${monthName} ${year} г.`;
  }

  previousMonth() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.updateWeekDays();
  }

  nextMonth() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.updateWeekDays();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Фильтры
  toggleFilter(type: 'coffee' | 'type' | 'employee') {
    if (type === 'coffee') {
      this.showCoffeeFilter = !this.showCoffeeFilter;
      this.showTypeFilter = false;
      this.showEmployeeFilter = false;
    } else if (type === 'type') {
      this.showTypeFilter = !this.showTypeFilter;
      this.showCoffeeFilter = false;
      this.showEmployeeFilter = false;
    } else {
      this.showEmployeeFilter = !this.showEmployeeFilter;
      this.showCoffeeFilter = false;
      this.showTypeFilter = false;
    }
  }

  selectCoffeeShop(shop: string) {
    this.selectedCoffeeShop = shop;
    this.showCoffeeFilter = false;
    
    if (shop === 'all') {
      const currentUser = this.authService.getCurrentUserValue();
      this.currentUserCoffeeShop = typeof currentUser?.coffeeShop === 'string' 
        ? currentUser.coffeeShop 
        : (currentUser?.coffeeShop as any)?._id || '';
    } else {
      this.currentUserCoffeeShop = shop;
    }
    
    this.loadInitialData();
  }

  getSelectedCoffeeShopName(): string {
    if (this.selectedCoffeeShop === 'all') {
      return 'Все кофейни';
    }
    const shop = this.coffeeShops.find(c => c.id === this.selectedCoffeeShop);
    return shop ? shop.name : 'Кофейня';
  }

  toggleShiftType(type: string) {
    this.selectedTypes[type] = !this.selectedTypes[type];
  }

  toggleEmployee(employeeId: string) {
    this.selectedEmployees[employeeId] = !this.selectedEmployees[employeeId];
  }

  get filteredEmployees(): Employee[] {
    return this.employees.filter(emp => this.selectedEmployees[emp.id]);
  }

  getFilteredShift(employeeId: string, date: string): Shift | undefined {
    const shift = this.shifts.find(s => s.employeeId === employeeId && s.date === date);
    
    if (!shift) return undefined;
    if (!this.selectedTypes[shift.type]) return undefined;
    
    return shift;
  }

  getShiftLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'work': 'Смена',
      'sick_leave': 'Больничный',
      'vacation': 'Отпуск'
    };
    return labels[type] || '';
  }

  calculateHours(startTime: string, endTime: string): number {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    return endHour - startHour;
  }

  openShiftModal(employee: Employee, day: Day) {
    const existingShift = this.shifts.find(s => 
      s.employeeId === employee.id && s.date === day.date
    );
    
    if (existingShift) {
      const confirmEdit = confirm(
        `У сотрудника ${employee.name} уже есть запись на ${day.date} (${existingShift.status}).\n\nХотите отредактировать существующую смену?`
      );
      
      if (confirmEdit) {
        this.editShift(employee, day, existingShift);
      }
      return;
    }
    
    this.selectedEmployee = employee;
    this.selectedDay = day;
    this.editingShift = null;
    this.newShift = {
      type: 'work',
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
    if (!this.selectedEmployee || !this.selectedDay) {
      alert('Ошибка: не выбран сотрудник или день');
      return;
    }

    const coffeeShopId = this.currentUserCoffeeShop || this.selectedEmployee.coffeeShop;

    if (!coffeeShopId) {
      alert('Ошибка: не указана кофейня. Убедитесь, что у сотрудника назначена кофейня.');
      return;
    }

    const shiftData = {
      user: this.selectedEmployee.id,
      coffeeShop: coffeeShopId,
      date: this.selectedDay.date,
      type: this.newShift.type as 'work' | 'sick_leave' | 'vacation',
      startTime: this.newShift.type === 'work' ? this.newShift.startTime : undefined,
      endTime: this.newShift.type === 'work' ? this.newShift.endTime : undefined,
      hourlyRate: this.selectedEmployee.hourlyRate
    };

    console.log('Saving shift with data:', shiftData);

    if (this.editingShift) {
      this.shiftService.updateShift(this.editingShift.id, shiftData).subscribe({
        next: (updatedShift: any) => {
          console.log('Updated shift response:', updatedShift);
          
          const shiftData = updatedShift?.data?.shift || updatedShift?.shift || updatedShift;
          console.log('Extracted shift data:', shiftData);
          
          const index = this.shifts.findIndex(s => s.id === this.editingShift!.id);
          if (index !== -1) {
            this.shifts[index] = this.mapApiShiftToShift(shiftData, 
              this.employees.map(e => ({
                _id: e.id,
                fullName: e.name,
                hourlyRate: e.hourlyRate,
                coffeeShop: e.coffeeShop
              } as any))
            );
          }
          this.closeModal();
          alert('Смена успешно обновлена');
          this.loadShiftsForCurrentWeek();
        },
        error: (error: any) => {
          console.error('Ошибка обновления смены:', error);
          const message = error?.error?.message || 'Не удалось обновить смену';
          alert(message);
        }
      });
    } else {
      this.shiftService.createShift(shiftData).subscribe({
        next: (newShift: any) => {
          console.log('Created shift response:', newShift);
          
          const shiftData = newShift?.data?.shift || newShift?.shift || newShift;
          console.log('Extracted shift data:', shiftData);
          
          this.shifts.push(this.mapApiShiftToShift(shiftData, 
            this.employees.map(e => ({
              _id: e.id,
              fullName: e.name,
              hourlyRate: e.hourlyRate,
              coffeeShop: e.coffeeShop
            } as any))
          ));
          this.closeModal();
          alert('Смена успешно создана');
          this.loadShiftsForCurrentWeek();
        },
        error: (error: any) => {
          console.error('Ошибка создания смены:', error);
          const message = error?.error?.message || 'Не удалось создать смену';
          alert(message);
        }
      });
    }
  }

  deleteShift(shift: Shift) {
    if (confirm('Вы уверены, что хотите удалить эту смену?')) {
      this.shiftService.deleteShift(shift.id).subscribe({
        next: () => {
          this.shifts = this.shifts.filter(s => s.id !== shift.id);
          alert('Смена успешно удалена');
          this.loadShiftsForCurrentWeek();
        },
        error: (error: any) => {
          console.error('Ошибка удаления смены:', error);
          const message = error?.error?.message || 'Не удалось удалить смену';
          alert(message);
        }
      });
    }
  }

  closeModal() {
    this.showAddModal = false;
    this.selectedEmployee = null;
    this.selectedDay = null;
    this.editingShift = null;
  }

  approveRequest(request: ShiftRequest) {
    if (confirm('Одобрить этот запрос?')) {
      this.shiftRequests = this.shiftRequests.filter(r => r.id !== request.id);
    }
  }

  rejectRequest(request: ShiftRequest) {
    if (confirm('Отклонить этот запрос?')) {
      this.shiftRequests = this.shiftRequests.filter(r => r.id !== request.id);
    }
  }

  switchTab(tab: 'requests' | 'preferences') {
    this.activeTab = tab;
  }

    /**
   * Получить количество выбранных wishes
   */
  getSelectedWishesCount(): number {
    return this.ganttWishes.filter(w => w.selected).length;
  }

  /**
   * Проверить, есть ли выбранные wishes
   */
  hasSelectedWishes(): boolean {
    return this.ganttWishes.some(w => w.selected);
  }

  
}