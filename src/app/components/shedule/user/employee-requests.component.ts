// src/app/components/schedule/employee/employee-requests.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WishService, Wish } from '../../../services/wish.service';
import { AuthService } from '../../../services/auth.service';
import { RouterLink } from '@angular/router';

interface WishUI {
  id: string;
  employeeName: string;
  type: string;
  typeLabel: string;
  date: string;
  dateFormatted: string;
  swapWithName?: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: string;
  statusClass: string;
  managerResponse?: string;
}

interface NewWishForm {
  type: 'work' | 'sick_leave' | 'vacation' | 'day_off' | 'swap';
  date: string;
  startTime: string;
  endTime: string;
  comment: string;
  swapWithUser?: string;
}

@Component({
  selector: 'app-employee-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-requests.component.html',
  styleUrls: ['./employee-requests.component.scss']
})
export class EmployeeRequestsComponent implements OnInit {
  private wishService = inject(WishService);
  private authService = inject(AuthService);

  isLoading = false;
  errorMessage = '';
  showNewRequestModal = false;
  isSubmitting = false;

  activeRequests: WishUI[] = [];
  requestHistory: WishUI[] = [];
  wishes: Wish[] = [];

  newRequest: NewWishForm = {
    type: 'day_off',
    date: '',
    startTime: '08:00',
    endTime: '16:00',
    comment: ''
  };

  currentUser: any = null;
  selectedMonth = new Date();
  calendarDays: any[] = [];

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUserValue();
    console.log('Current user:', this.currentUser);
    
    if (!this.currentUser) {
      this.errorMessage = 'Пользователь не авторизован';
      return;
    }

    this.loadWishes();
  }

  loadWishes() {
    this.isLoading = true;
    this.errorMessage = '';

    this.wishService.getWishes({ limit: 100 }).subscribe({
      next: (response: any) => {
        console.log('Wishes response:', response);
        console.log('Response structure:', {
          isArray: Array.isArray(response),
          hasData: !!response?.data,
          dataIsArray: Array.isArray(response?.data),
          hasDataWishes: !!response?.data?.wishes,
          dataWishesIsArray: Array.isArray(response?.data?.wishes)
        });

        let wishesArray: Wish[] = [];
        
        if (Array.isArray(response)) {
          wishesArray = response;
        } else if (response?.data?.wishes && Array.isArray(response.data.wishes)) {
          wishesArray = response.data.wishes;
        } else if (response?.data?.wish) {
          wishesArray = [response.data.wish];
        } else if (response?.wishes && Array.isArray(response.wishes)) {
          wishesArray = response.wishes;
        } else if (response?.data && Array.isArray(response.data)) {
          wishesArray = response.data;
        } else if (response?.wish) {
          wishesArray = [response.wish];
        }

        console.log('Wishes array:', wishesArray);
        console.log('Wishes array length:', wishesArray.length);

        // ИСПРАВЛЕНИЕ: используем id вместо _id
        const currentUserId = this.currentUser.id || this.currentUser._id;
        console.log('Current user ID:', currentUserId);
        console.log('Filtering wishes for user:', currentUserId);
        
        const myWishes = wishesArray.filter(w => {
          const wishUserId = typeof w.user === 'string' ? w.user : (w.user as any)?._id;
          console.log('Comparing wish user:', wishUserId, 'with current user:', currentUserId);
          return wishUserId === currentUserId;
        });

        console.log('My wishes after filter:', myWishes);
        console.log('My wishes count:', myWishes.length);

        this.wishes = myWishes;

        this.activeRequests = myWishes
          .filter(w => (w.status || 'pending') === 'pending')
          .map(w => this.mapWishToUI(w));

        this.requestHistory = myWishes
          .filter(w => (w.status || 'pending') !== 'pending')
          .map(w => this.mapWishToUI(w))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log('Active requests:', this.activeRequests);
        console.log('Request history:', this.requestHistory);

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Ошибка загрузки запросов:', error);
        this.errorMessage = 'Не удалось загрузить запросы';
        this.isLoading = false;
      }
    });
  }

  private mapWishToUI(wish: Wish): WishUI {
    const userName = typeof wish.user === 'string' 
      ? 'Вы' 
      : (wish.user as any)?.fullName || 'Вы';

    const swapWithName = wish.swapWithUser 
      ? (typeof wish.swapWithUser === 'string' 
          ? wish.swapWithUser 
          : (wish.swapWithUser as any)?.fullName || '')
      : undefined;

    return {
      id: wish._id,
      employeeName: userName,
      type: wish.type,
      typeLabel: this.getTypeLabel(wish.type),
      date: wish.date,
      dateFormatted: this.formatDate(new Date(wish.date)),
      swapWithName,
      comment: wish.comment || '',
      status: wish.status || 'pending',
      statusLabel: this.getStatusLabel(wish.status || 'pending'),
      statusClass: this.getStatusClass(wish.status || 'pending'),
      managerResponse: wish.managerComment
    };
  }

  private getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'work': 'Смена',
      'sick_leave': 'Больничный',
      'vacation': 'Отпуск',
      'day_off': 'Выходной',
      'swap': 'Замена смены'
    };
    return labels[type] || type;
  }

  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'На рассмотрении',
      'approved': 'Одобрено',
      'rejected': 'Отклонено'
    };
    return labels[status] || status;
  }

  private getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    return classes[status] || '';
  }

  private formatDate(date: Date): string {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${dayName}, ${day} ${month}`;
  }

  openNewRequestModal() {
    this.newRequest = {
      type: 'day_off',
      date: '',
      startTime: '08:00',
      endTime: '16:00',
      comment: ''
    };
    
    this.selectedMonth = new Date();
    this.generateCalendar();
    this.showNewRequestModal = true;
  }

  closeModal() {
    this.showNewRequestModal = false;
    this.errorMessage = '';
  }

  generateCalendar() {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);
    
    this.calendarDays = [];
    
    for (let week = 0; week < 5; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        
        this.calendarDays.push({
          date: currentDate,
          dateString: this.formatDateString(currentDate),
          dayNumber: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          isSelected: this.newRequest.date === this.formatDateString(currentDate)
        });
      }
    }
  }

  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectDate(day: any) {
    if (!day.isCurrentMonth) return;
    
    this.newRequest.date = day.dateString;
    this.generateCalendar();
  }

  previousMonth() {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getMonthYearDisplay(): string {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    return `${months[this.selectedMonth.getMonth()]} ${this.selectedMonth.getFullYear()}`;
  }

  submitRequest() {
    if (!this.newRequest.type) {
      this.errorMessage = 'Выберите тип запроса';
      return;
    }

    if (!this.newRequest.date) {
      this.errorMessage = 'Выберите дату';
      return;
    }

    const selectedDate = new Date(this.newRequest.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      this.errorMessage = 'Нельзя создать запрос на прошедшую дату';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const wishData: any = {
      date: this.newRequest.date,
      type: this.newRequest.type,
      comment: this.newRequest.comment || undefined
    };

    if (this.newRequest.type === 'work' || this.newRequest.type === 'swap') {
      wishData.startTime = this.newRequest.startTime;
      wishData.endTime = this.newRequest.endTime;
    }

    console.log('Creating wish with data:', wishData);

    this.wishService.createWish(wishData).subscribe({
      next: (response: any) => {
        console.log('Wish created response:', response);
        console.log('Response structure:', {
          hasData: !!response?.data,
          hasWish: !!response?.wish,
          hasDataWish: !!response?.data?.wish
        });
        
        this.isSubmitting = false;
        this.closeModal();
        
        alert('Запрос успешно отправлен! Вы получите уведомление о решении в течение 24 часов.');
        
        console.log('Reloading wishes after creation...');
        this.loadWishes();
      },
      error: (error: any) => {
        console.error('Ошибка создания запроса:', error);
        
        this.isSubmitting = false;
        
        const message = error?.error?.message || 'Не удалось отправить запрос';
        this.errorMessage = message;
      }
    });
  }

  shouldShowTimeFields(): boolean {
    return this.newRequest.type === 'work' || this.newRequest.type === 'swap';
  }

  getActiveRequestsCount(): number {
    return this.activeRequests.length;
  }

  debugAPI() {
    console.log('=== DEBUG API ===');
    console.log('Current user:', this.currentUser);
    console.log('Current user ID (id):', this.currentUser?.id);
    console.log('Current user ID (_id):', this.currentUser?._id);
    console.log('Using ID:', this.currentUser?.id || this.currentUser?._id);
    console.log('Active requests:', this.activeRequests);
    console.log('Request history:', this.requestHistory);
    console.log('Raw wishes:', this.wishes);
    
    this.wishService.getWishes({ limit: 100 }).subscribe({
      next: (response) => {
        console.log('=== Direct API Call ===');
        console.log('Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is array?', Array.isArray(response));
        console.log('Response.data:', (response as any)?.data);
        console.log('Response.data.wishes:', (response as any)?.data?.wishes);
        console.log('Response.wishes:', (response as any)?.wishes);
        
        alert('Проверьте консоль браузера для детальной информации (F12)');
      },
      error: (error) => {
        console.error('API Error:', error);
        alert('Ошибка API - проверьте консоль');
      }
    });
  }
}