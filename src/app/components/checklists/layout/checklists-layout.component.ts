import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TuiIcon, TuiDropdown } from '@taiga-ui/core';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { TuiCalendarRange } from '@taiga-ui/kit/components/calendar-range';
import { AuthService, User } from '../../../services/auth.service';
import { ChecklistPeriodService } from '../../../services/checklist-period.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-checklists-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule, TuiIcon, TuiDropdown, TuiCalendarRange],
  templateUrl: './checklists-layout.component.html',
  styleUrl: './checklists-layout.component.scss',
})
export class ChecklistsLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  periodService = inject(ChecklistPeriodService);

  isCollapsed = signal(false);
  /** Временно скрыть вкладку «Чек-листы» на странице статистики */
  showChecklistsTab = false;
  currentUser: User | null = null;
  calendarOpen = false;
  range: TuiDayRange | null = null;

  readonly navItems: NavItem[] = [
    { label: 'Статистика', icon: '@tui.bar-chart-2', route: '/checklists/statistics' },
    { label: 'Персонал', icon: '@tui.users', route: '/checklists/personnel' },
  ];

  get userInitials(): string {
    const name = this.currentUser?.fullName ?? '';
    const parts = name.trim().split(/\s+/);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || 'АД'
    );
  }

  get userRoleLabel(): string {
    const role = this.currentUser?.role;
    if (role === 'admin') return 'Администратор';
    if (role === 'manager') return 'Управляющий';
    return 'Бариста';
  }

  get isPersonnelTabsMode(): boolean {
    return (
      this.router.url.startsWith('/checklists/personnel') ||
      this.router.url.startsWith('/checklists/medical')
    );
  }

  isNavItemActive(item: NavItem): boolean {
    if (item.route === '/checklists/personnel') {
      return this.isPersonnelTabsMode;
    }
    return this.router.url.startsWith(item.route);
  }

  periodDisplay = computed(() => {
    const r = this.range;
    if (!r) return 'с — по —';
    return `с ${this.formatDay(r.from)} по ${this.formatDay(r.to)}`;
  });

  private formatDay(d: TuiDay): string {
    const day = String(d.day).padStart(2, '0');
    const month = String(d.month + 1).padStart(2, '0');
    return `${day}.${month}.${d.year}`;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.authService.currentUser$.subscribe((u) => (this.currentUser = u));
    this.syncRangeFromPeriod();
  }

  private syncRangeFromPeriod(): void {
    const p = this.periodService.getPeriod();
    this.range = new TuiDayRange(
      TuiDay.jsonParse(p.dateFrom),
      TuiDay.jsonParse(p.dateTo)
    );
  }

  onRangeChange(value: TuiDayRange | null): void {
    this.range = value;
    if (value) {
      this.periodService.setPeriod(value.from.toJSON(), value.to.toJSON());
      this.calendarOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed.update((v) => !v);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
