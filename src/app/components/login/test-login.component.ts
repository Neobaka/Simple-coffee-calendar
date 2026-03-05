// src/app/components/test-login/test-login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-test-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './test-login.component.html',
  styleUrls: ['./test-login.component.scss']
})
export class TestLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  loginAsAdmin(): void {
    this.loginForm.patchValue({
      login: 'admin',
      password: 'admin123'
    });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { login, password } = this.loginForm.value;

      this.authService.login(login, password).subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.user) {
            const userName = response.data.user.fullName || response.data.user.email;
            this.successMessage = `Добро пожаловать, ${userName}!`;
            
            // Определяем маршрут в зависимости от роли
            const userRole = response.data.user.role;
            let redirectUrl: string;
            
            if (userRole === 'admin' || userRole === 'manager' || userRole === 'supervisor') {
              redirectUrl = '/checklists/statistics';
            } else if (userRole === 'barista') {
              redirectUrl = '/person-schedule';
            } else {
              // Если роль неизвестна, перенаправляем на dashboard
              redirectUrl = '/dashboard';
            }
            
            // Переадресация с небольшой задержкой для показа сообщения
            setTimeout(() => {
              this.router.navigate([redirectUrl]);
            }, 500);
          } else {
            this.successMessage = 'Вход выполнен успешно!';
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 500);
          }
        },
        error: (error) => {
          this.isLoading = false;
          
          if (error.status === 401) {
            this.errorMessage = 'Неверный логин или пароль';
          } else if (error.status === 0) {
            this.errorMessage = 'Не удается подключиться к серверу';
          } else {
            this.errorMessage = error.error?.message || 'Ошибка входа';
          }
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}