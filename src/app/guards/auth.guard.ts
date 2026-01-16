// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};

// Guard для админа
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const user = authService.getCurrentUserValue();
  
  if (user?.role === 'admin' || user?.role === 'manager') {
    return true;
  }

  // Если не админ/менеджер, перенаправляем на страницу бариста
  router.navigate(['/person-schedule']);
  return false;
};

// Guard для бариста
export const baristaGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const user = authService.getCurrentUserValue();
  
  if (user?.role === 'barista') {
    return true;
  }

  // Если не бариста, перенаправляем на админ страницу
  router.navigate(['/admin-schedule']);
  return false;
};