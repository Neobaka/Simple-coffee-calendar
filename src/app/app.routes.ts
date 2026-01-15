// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { TestLoginComponent } from './components/login/test-login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ScheduleComponent } from './components/shedule/shedule.component';
import { OverviewComponent } from './components/shedule/admin/overview/overview.component';
import { CoffeeShopsComponent } from './components/shedule/admin/coffee-shops/coffee-shops.component';
import { EmployeesComponent } from './components/shedule/admin/employees/employees.component';
import { AdminScheduleComponent } from './components/shedule/admin/schedule/admin-schedule.component';
import { PersonScheduleComponent } from './components/shedule/user/person-schedule.component'; // ИСПРАВЛЕНО
import { MobileScheduleComponent } from './components/shedule/mobile-schedule.component';
import { EmployeeRequestsComponent } from './components/shedule/user/employee-requests.component';


export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: TestLoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'schedule', component: ScheduleComponent, canActivate: [authGuard] },
  { path: 'overview', component: OverviewComponent, canActivate: [authGuard]},
  { path: 'coffee-shops', component: CoffeeShopsComponent, canActivate: [authGuard] },
  { path: 'employees', component: EmployeesComponent, canActivate: [authGuard] },
  { path: 'admin-schedule', component: AdminScheduleComponent, canActivate: [authGuard] },
  { path: 'person-schedule', component: PersonScheduleComponent, canActivate: [authGuard] }, // ИСПРАВЛЕНО
  { path: 'mobile-schedule', component: MobileScheduleComponent, canActivate: [authGuard] },
  { path: 'employee-requests', component: EmployeeRequestsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' },
];