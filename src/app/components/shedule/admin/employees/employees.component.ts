import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, User, UserCreate, UserUpdate } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { CoffeeShopService, CoffeeShop as ICoffeeShop } from '../../../../services/coffee-shop.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';



@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {
  users: User[] = [];
  coffeeShops: ICoffeeShop[] = [];
  currentUser: any = null;
  
  // Пагинация
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;

  // Фильтры
  selectedCoffeeShop: string = 'Все кофейни';
  showCoffeeShopFilter = false;
  
  // Модальное окно
  showModal = false;
  isEditMode = false;
  editingUserId: string | null = null;
  
  // Форма
  userForm: FormGroup;
  
  // Для твоего HTML
  formStep = 1;
  showRoleDropdown = false;
  showShopDropdown = false;
  formData = {
    role: 'Бариста',
    name: '',
    coffeeShop: 'Выберите кофейню',
    hourlyRate: '',
    password: '',
    login: ''
  };
  
  loading = false;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private coffeeShopService: CoffeeShopService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', Validators.required],
      role: ['barista', Validators.required],
      coffeeShop: ['', Validators.required],
      hourlyRate: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCoffeeShops();
    this.loadUsers();
  }

  loadCurrentUser(): void {
    // Получаем текущего пользователя из сервиса
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.currentUser = user;
      },
      error: (err: any) => {
        console.error('Ошибка загрузки текущего пользователя:', err);
      }
    });
  }

  loadCoffeeShops(): void {
    this.coffeeShopService.getCoffeeShops().subscribe({
      next: (response: any) => {
        console.log('Coffee shops response:', response); // Для отладки
        
        // Извлекаем массив из разных возможных структур
        if (Array.isArray(response)) {
          this.coffeeShops = response;
        } else if (response?.data?.coffeeShops && Array.isArray(response.data.coffeeShops)) {
          // Твой случай: {success: true, data: {coffeeShops: [...], pagination: {...}}}
          this.coffeeShops = response.data.coffeeShops;
        } else if (response?.coffeeShops && Array.isArray(response.coffeeShops)) {
          this.coffeeShops = response.coffeeShops;
        } else if (response?.data && Array.isArray(response.data)) {
          this.coffeeShops = response.data;
        } else {
          console.error('Unexpected response format:', response);
          this.coffeeShops = [];
        }
        
        console.log('Parsed coffee shops:', this.coffeeShops);
      },
      error: (err: any) => {
        console.error('Ошибка загрузки кофеен:', err);
        this.error = 'Не удалось загрузить список кофеен';
        this.coffeeShops = [];
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };

    // НЕ фильтруем на API - фильтруем клиентской стороне через filteredEmployees
    console.log('Loading users with params:', params);

    this.userService.getUsers(params).subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        
        // Извлекаем пользователей из разных форматов ответа
        if (response.data?.users) {
          this.users = response.data.users;
          this.total = response.data.pagination?.total || response.total || 0;
          this.totalPages = response.data.pagination?.totalPages || response.totalPages || 1;
        } else if (response.users) {
          this.users = response.users;
          this.total = response.total || 0;
          this.totalPages = response.totalPages || 1;
        } else {
          this.users = [];
          this.total = 0;
          this.totalPages = 1;
        }
        
        this.loading = false;
        console.log('Loaded users:', this.users);
      },
      error: (err: any) => {
        this.error = 'Ошибка загрузки пользователей';
        this.loading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.userForm.reset({
      role: 'barista',
      hourlyRate: 0
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.editingUserId = user._id;
    this.formStep = 1;
    
    // Заполняем форму данными пользователя
    this.formData = {
      role: user.role === 'manager' ? 'Управляющий' : user.role === 'admin' ? 'Администратор' : 'Бариста',
      name: user.fullName,
      coffeeShop: this.getCoffeeShopName(user.coffeeShop),
      hourlyRate: user.hourlyRate.toString(),
      password: '', // Пароль пустой при редактировании
      login: user.email
    };
    
    this.showModal = true;
    console.log('Editing user:', user, 'Form data:', this.formData);
  }

  closeModal(): void {
    this.showModal = false;
    this.userForm.reset();
    this.editingUserId = null;
    this.error = null;
    this.formStep = 1;
    this.showRoleDropdown = false;
    this.showShopDropdown = false;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditMode && this.editingUserId) {
      const updateData: UserUpdate = { ...this.userForm.value };
      
      if (!updateData.password) {
        delete updateData.password;
      }

      this.userService.updateUser(this.editingUserId, updateData).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Ошибка обновления пользователя';
          this.loading = false;
          console.error(err);
        }
      });
    } else {
      const createData: UserCreate = this.userForm.value;
      
      this.userService.createUser(createData).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Ошибка создания пользователя';
          this.loading = false;
          console.error(err);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`Вы уверены, что хотите деактивировать пользователя ${user.fullName}?`)) {
      return;
    }

    this.loading = true;
    this.userService.deleteUser(user._id).subscribe({
      next: () => {
        this.loadUsers();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Ошибка удаления пользователя';
        this.loading = false;
        console.error(err);
      }
    });
  }

  activateUser(user: User): void {
    this.loading = true;
    this.userService.activateUser(user._id).subscribe({
      next: () => {
        this.loadUsers();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Ошибка активации пользователя';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      barista: 'Бариста',
      manager: 'Менеджер',
      admin: 'Администратор'
    };
    return roleNames[role] || role;
  }

  getCoffeeShopName(coffeeShopId: string | any): string {
    // Если пришел объект (бэкенд вернул populate), берем name напрямую
    if (typeof coffeeShopId === 'object' && coffeeShopId !== null) {
      return coffeeShopId.name || 'Не указано';
    }
    
    // Если пришел ID, ищем в списке
    const shop = this.coffeeShops.find(s => s._id === coffeeShopId);
    return shop ? shop.name : 'Не указано';
  }

  canEdit(): boolean {
    return this.currentUser?.role === 'admin';
  }

  canDelete(): boolean {
    return this.currentUser?.role === 'admin';
  }

  // Методы для твоего HTML
  get employees() {
    // Добавляем поле name для совместимости с твоим HTML
    if (!this.users || !Array.isArray(this.users)) {
      return [];
    }
    return this.users.map(user => ({
      ...user,
      name: user.fullName
    }));
  }

  get filteredEmployees() {
    if (this.selectedCoffeeShop === 'Все кофейни') {
      return this.employees;
    }
    
    return this.employees.filter((user: any) => {
      const coffeeShopName = this.getCoffeeShopName(user.coffeeShop);
      return coffeeShopName === this.selectedCoffeeShop;
    });
  }

  openAddModal(): void {
    this.formStep = 1;
    this.formData = {
      role: 'Бариста',
      name: '',
      coffeeShop: 'Выберите кофейню',
      hourlyRate: '',
      password: '',
      login: ''
    };
    this.showModal = true;
  }

  selectCoffeeShop(shop: string): void {
    this.selectedCoffeeShop = shop;
    this.showCoffeeShopFilter = false;
    // НЕ перезагружаем с API - фильтрация происходит через filteredEmployees getter
  }

  selectRole(role: string): void {
    this.formData.role = role;
    this.showRoleDropdown = false;
  }

  selectShop(shop: string): void {
    this.formData.coffeeShop = shop;
    this.showShopDropdown = false;
  }

  editEmployee(employee: User): void {
    this.openEditModal(employee);
  }

  deleteEmployee(employee: User): void {
    this.deleteUser(employee);
  }

  nextStep(): void {
    if (this.formStep < 6) {
      this.formStep++;
    } else {
      // Последний шаг - создаем пользователя
      this.submitForm();
    }
  }

  canProceed(): boolean {
    switch (this.formStep) {
      case 1: return !!this.formData.role;
      case 2: return !!this.formData.name && this.formData.name.length >= 2;
      case 3: return this.formData.coffeeShop !== 'Выберите кофейню';
      case 4: return !!this.formData.hourlyRate && parseFloat(this.formData.hourlyRate) > 0;
      case 5: {
        // При редактировании пароль необязателен
        if (this.isEditMode) {
          return !this.formData.password || this.formData.password.length >= 6;
        }
        return !!this.formData.password && this.formData.password.length >= 6;
      }
      case 6: {
        // Проверка валидности email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !!this.formData.login && emailRegex.test(this.formData.login);
      }
      default: return false;
    }
  }

  private submitForm(): void {
    console.log('submitForm called, formData:', this.formData, 'isEditMode:', this.isEditMode, 'editingUserId:', this.editingUserId);
    
    // Проверяем что coffeeShops это массив
    if (!Array.isArray(this.coffeeShops) || this.coffeeShops.length === 0) {
      this.error = 'Список кофеен не загружен. Попробуйте перезагрузить страницу.';
      console.error('coffeeShops is not an array:', this.coffeeShops);
      return;
    }

    console.log('Available coffee shops:', this.coffeeShops);
    console.log('Looking for:', this.formData.coffeeShop);

    // Находим ID выбранной кофейни по точному совпадению имени
    const coffeeShop = this.coffeeShops.find(shop => 
      shop.name === this.formData.coffeeShop
    );

    console.log('Found coffee shop:', coffeeShop);

    if (!coffeeShop) {
      this.error = 'Выберите кофейню из списка';
      return;
    }

    // РЕДАКТИРОВАНИЕ
    if (this.isEditMode && this.editingUserId) {
      const updateData: UserUpdate = {
        email: this.formData.login,
        fullName: this.formData.name,
        role: this.formData.role === 'Управляющий' ? 'manager' : this.formData.role === 'Администратор' ? 'admin' : 'barista',
        coffeeShop: coffeeShop._id,
        hourlyRate: parseFloat(this.formData.hourlyRate)
      };

      // Добавляем пароль только если он заполнен
      if (this.formData.password && this.formData.password.length >= 6) {
        updateData.password = this.formData.password;
      }

      console.log('Updating user with data:', updateData);

      this.loading = true;
      this.userService.updateUser(this.editingUserId, updateData).subscribe({
        next: (user) => {
          console.log('User updated successfully:', user);
          this.closeModal();
          this.loadUsers();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error updating user:', err);
          this.error = err.error?.message || 'Ошибка обновления пользователя';
          this.loading = false;
        }
      });
      return;
    }

    // СОЗДАНИЕ
    const createData: UserCreate = {
      email: this.formData.login,
      password: this.formData.password,
      fullName: this.formData.name,
      role: this.formData.role === 'Управляющий' ? 'manager' : this.formData.role === 'Администратор' ? 'admin' : 'barista',
      coffeeShop: coffeeShop._id,
      hourlyRate: parseFloat(this.formData.hourlyRate)
    };

    console.log('Creating user with data:', createData);

    this.loading = true;
    this.userService.createUser(createData).subscribe({
      next: (user) => {
        console.log('User created successfully:', user);
        this.closeModal();
        this.loadUsers();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error creating user:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.error?.message,
          errors: err.error?.errors,
          fullError: err.error
        });
        this.error = err.error?.message || err.error?.error || 'Ошибка создания пользователя';
        this.loading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}