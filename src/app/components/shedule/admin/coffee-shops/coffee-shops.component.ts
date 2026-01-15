// src/app/components/shedule/admin/coffee-shops/coffee-shops.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CoffeeShopService, CoffeeShop, CoffeeShopCreate, CoffeeShopsListResponse } from '../../../../services/coffee-shop.service';

@Component({
  selector: 'app-coffee-shops',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './coffee-shops.component.html',
  styleUrls: ['./coffee-shops.component.scss']
})
export class CoffeeShopsComponent implements OnInit {
  private coffeeShopService = inject(CoffeeShopService);

  // UI State
  showAddModal = false;
  editingShop: CoffeeShop | null = null;
  isLoading = false;
  error: string | null = null;

  // Data
  coffeeShops: CoffeeShop[] = []; // Инициализируем пустым массивом
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  totalShops = 0;

  // Form Data
  formData: CoffeeShopCreate = {
    name: '',
    address: '',
    phone: '',
    openTime: '08:00',
    closeTime: '20:00',
    timezone: 'Asia/Yekaterinburg',
    maxBaristasPerShift: 3
  };

  ngOnInit() {
    this.loadCoffeeShops();
  }

  /**
   * Загрузить список кофеен из API
   */
  loadCoffeeShops() {
    this.isLoading = true;
    this.error = null;

    console.log('Загрузка кофеен...', {
      page: this.currentPage,
      limit: this.limit,
      apiUrl: this.coffeeShopService['apiUrl'] // для отладки
    });

    this.coffeeShopService.getCoffeeShops({
      page: this.currentPage,
      limit: this.limit
    }).subscribe({
      next: (response: any) => {
        console.log('Получен ответ:', response);
        
        // Проверяем формат ответа от backend
        if (response.success && response.data) {
          // Формат: { success: true, data: { coffeeShops: [...], pagination: {...} } }
          this.coffeeShops = response.data.coffeeShops || [];
          this.totalShops = response.data.pagination?.total || 0;
          this.totalPages = response.data.pagination?.totalPages || 1;
          this.currentPage = response.data.pagination?.page || 1;
        } else if (response.coffeeShops) {
          // Формат: { coffeeShops: [...], total: ..., page: ... }
          this.coffeeShops = response.coffeeShops;
          this.totalShops = response.total;
          this.totalPages = response.totalPages;
          this.currentPage = response.page;
        } else {
          console.error('Неожиданный формат ответа:', response);
          this.coffeeShops = [];
        }
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Ошибка загрузки:', err);
        
        // Проверяем, не редирект ли это на login
        if (err.url?.includes('/login')) {
          this.error = 'Требуется авторизация. Пожалуйста, войдите в систему.';
        } else if (err.status === 0) {
          this.error = 'Не удается подключиться к серверу. Проверьте, что backend запущен.';
        } else {
          this.error = err.error?.message || `Ошибка при загрузке кофеен (${err.status})`;
        }
        
        this.isLoading = false;
      }
    });
  }

  /**
   * Открыть модальное окно для редактирования
   */
  editShop(shop: CoffeeShop) {
    this.editingShop = shop;
    this.formData = {
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      openTime: shop.openTime,
      closeTime: shop.closeTime,
      timezone: shop.timezone,
      maxBaristasPerShift: shop.maxBaristasPerShift
    };
    this.showAddModal = true;
  }

  /**
   * Удалить (деактивировать) кофейню
   */
  deleteShop(shop: CoffeeShop) {
    if (!confirm(`Вы уверены, что хотите деактивировать "${shop.name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.coffeeShopService.deleteCoffeeShop(shop._id).subscribe({
      next: () => {
        console.log('Кофейня деактивирована');
        this.loadCoffeeShops(); // Перезагрузить список
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Ошибка при удалении кофейни';
        this.isLoading = false;
        console.error('Ошибка удаления:', err);
      }
    });
  }

  /**
   * Активировать кофейню
   */
  activateShop(shop: CoffeeShop) {
    this.isLoading = true;
    this.error = null;

    this.coffeeShopService.activateCoffeeShop(shop._id).subscribe({
      next: () => {
        console.log('Кофейня активирована');
        this.loadCoffeeShops();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Ошибка при активации кофейни';
        this.isLoading = false;
        console.error('Ошибка активации:', err);
      }
    });
  }

  /**
   * Закрыть модальное окно
   */
  closeModal() {
    this.showAddModal = false;
    this.editingShop = null;
    this.resetForm();
    this.error = null;
  }

  /**
   * Сохранить кофейню (создать или обновить)
   */
  saveShop() {
    // Валидация
    if (!this.formData.name || !this.formData.address || !this.formData.phone) {
      this.error = 'Пожалуйста, заполните все обязательные поля';
      return;
    }

    this.isLoading = true;
    this.error = null;

    if (this.editingShop) {
      // Обновление существующей кофейни
      this.coffeeShopService.updateCoffeeShop(this.editingShop._id, this.formData).subscribe({
        next: (response: any) => {
          console.log('Кофейня обновлена:', response);
          this.loadCoffeeShops();
          this.closeModal();
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Ошибка при обновлении кофейни';
          this.isLoading = false;
          console.error('Ошибка обновления:', err);
        }
      });
    } else {
      // Создание новой кофейни
      this.coffeeShopService.createCoffeeShop(this.formData).subscribe({
        next: (response: any) => {
          console.log('Кофейня создана:', response);
          this.loadCoffeeShops();
          this.closeModal();
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Ошибка при создании кофейни';
          this.isLoading = false;
          console.error('Ошибка создания:', err);
        }
      });
    }
  }

  /**
   * Сбросить форму
   */
  resetForm() {
    this.formData = {
      name: '',
      address: '',
      phone: '',
      openTime: '08:00',
      closeTime: '20:00',
      timezone: 'Asia/Yekaterinburg',
      maxBaristasPerShift: 3
    };
  }

  /**
   * Получить количество сотрудников (заглушка, можно доработать)
   */
  getEmployeesCount(shop: CoffeeShop): number {
    // TODO: Добавить реальный подсчет из API или связанных данных
    return 0;
  }

  /**
   * Пагинация - следующая страница
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCoffeeShops();
    }
  }

  /**
   * Пагинация - предыдущая страница
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCoffeeShops();
    }
  }
}