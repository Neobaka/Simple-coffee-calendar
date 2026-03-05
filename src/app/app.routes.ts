// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, baristaGuard } from './guards/auth.guard';
import { TestLoginComponent } from './components/login/test-login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ScheduleComponent } from './components/shedule/shedule.component';
import { OverviewComponent } from './components/shedule/admin/overview/overview.component';
import { CoffeeShopsComponent } from './components/shedule/admin/coffee-shops/coffee-shops.component';
import { EmployeesComponent } from './components/shedule/admin/employees/employees.component';
import { AdminScheduleComponent } from './components/shedule/admin/schedule/admin-schedule.component';
import { PersonScheduleComponent } from './components/shedule/user/person-schedule.component';
import { MobileScheduleComponent } from './components/shedule/mobile-schedule.component';
import { EmployeeRequestsComponent } from './components/shedule/user/employee-requests.component';
import { ChecklistsLayoutComponent } from './components/checklists/layout/checklists-layout.component';
import { ChecklistsStatisticsComponent } from './components/checklists/statistics/checklists-statistics.component';
import { ChecklistsFormsComponent } from './components/checklists/forms/checklists-forms.component';
import { ChecklistsPersonnelComponent } from './components/checklists/personnel/checklists-personnel.component';
import { ChecklistsMedicalComponent } from './components/checklists/medical/checklists-medical.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: TestLoginComponent },
  { path: 'register', component: RegisterComponent },

  // Общие маршруты (доступны всем авторизованным)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'schedule', component: ScheduleComponent, canActivate: [authGuard] },
  { path: 'mobile-schedule', component: MobileScheduleComponent, canActivate: [authGuard] },

  // Маршруты только для админа/менеджера
  { path: 'overview', component: OverviewComponent, canActivate: [adminGuard] },
  { path: 'coffee-shops', component: CoffeeShopsComponent, canActivate: [adminGuard] },
  { path: 'employees', component: EmployeesComponent, canActivate: [adminGuard] },
  { path: 'admin-schedule', component: AdminScheduleComponent, canActivate: [adminGuard] },

  // Маршруты только для бариста
  { path: 'person-schedule', component: PersonScheduleComponent, canActivate: [baristaGuard] },
  { path: 'employee-requests', component: EmployeeRequestsComponent, canActivate: [baristaGuard] },

  // Чек-листы (отдельный модуль, доступен менеджерам и администраторам)
  {
    path: 'checklists',
    component: ChecklistsLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'statistics', pathMatch: 'full' },
      { path: 'statistics', component: ChecklistsStatisticsComponent },
      { path: 'forms', component: ChecklistsFormsComponent },
      { path: 'personnel', component: ChecklistsPersonnelComponent },
      { path: 'medical', component: ChecklistsMedicalComponent },
    ],
  },

  { path: '**', redirectTo: '/login' },
];