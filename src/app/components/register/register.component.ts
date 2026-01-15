// src/app/components/register/register.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h2>☕ Регистрация в Simple Coffee</h2>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Имя</label>
            <input 
              id="name"
              type="text" 
              formControlName="name"
              class="form-control"
              placeholder="Иван Иванов"
              [class.error]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched"
            />
            <div class="error-message" *ngIf="registerForm.get('name')?.invalid && registerForm.get('name')?.touched">
              <span *ngIf="registerForm.get('name')?.errors?.['required']">Имя обязательно</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email"
              type="email" 
              formControlName="email"
              class="form-control"
              placeholder="example@simplecoffee.ru"
              [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            />
            <div class="error-message" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">Email обязателен</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">Неверный формат email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Пароль</label>
            <input 
              id="password"
              type="password" 
              formControlName="password"
              class="form-control"
              placeholder="••••••••"
              [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
            />
            <div class="error-message" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              <span *ngIf="registerForm.get('password')?.errors?.['required']">Пароль обязателен</span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Минимум 6 символов</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Подтверждение пароля</label>
            <input 
              id="confirmPassword"
              type="password" 
              formControlName="confirmPassword"
              class="form-control"
              placeholder="••••••••"
              [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
            />
            <div class="error-message" *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched">
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">Подтверждение обязательно</span>
            </div>
            <div class="error-message" *ngIf="registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched">
              Пароли не совпадают
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            ⚠️ {{ errorMessage }}
          </div>

          <div class="success-message" *ngIf="successMessage">
            ✅ {{ successMessage }}
          </div>

          <button 
            type="submit" 
            class="btn-primary"
            [disabled]="registerForm.invalid || isLoading"
          >
            {{ isLoading ? '⏳ Загрузка...' : '📝 Зарегистрироваться' }}
          </button>
        </form>

        <div class="login-link">
          Уже есть аккаунт? <a routerLink="/login">Войти</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .register-card {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 420px;
    }

    h2 {
      margin: 0 0 30px 0;
      color: #333;
      text-align: center;
      font-size: 28px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 600;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 14px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 16px;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #8B4513;
      box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }

    .form-control.error {
      border-color: #f44336;
    }

    .error-message {
      color: #f44336;
      font-size: 13px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #ffebee;
      border-radius: 6px;
    }

    .success-message {
      color: #4CAF50;
      font-size: 13px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #e8f5e9;
      border-radius: 6px;
      margin-bottom: 15px;
    }

    .btn-primary {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
      box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 6px 25px rgba(139, 69, 19, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .login-link {
      text-align: center;
      margin-top: 25px;
      color: #666;
      font-size: 15px;
    }

    .login-link a {
      color: #8B4513;
      text-decoration: none;
      font-weight: 700;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    .api-info {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }

    .api-info p {
      margin: 0;
      font-size: 13px;
      color: #999;
    }

    .api-info code {
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      color: #8B4513;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
  if (this.registerForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { name, email, password } = this.registerForm.value;

    this.authService.register(name, email, password).subscribe({
      next: (response) => {
        console.log('Registration response:', response);
        
        if (response.success && response.data && response.data.user) {
          const userName = response.data.user.fullName || response.data.user.email;
          this.successMessage = `Регистрация успешна! Добро пожаловать, ${userName}!`;
        } else {
          this.successMessage = 'Регистрация успешна!';
        }
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        if (error.status === 409) {
          this.errorMessage = 'Пользователь с таким email уже существует';
        } else if (error.status === 0) {
          this.errorMessage = 'Не удается подключиться к серверу. Проверьте, запущен ли Docker.';
        } else {
          this.errorMessage = error.error?.message || 'Ошибка регистрации. Попробуйте снова.';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
}