import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { environment } from '../../../../environments/environment';
import { ChecklistPeriodService } from '../../../services/checklist-period.service';
import { CoffeeShopService } from '../../../services/coffee-shop.service';

interface BarItem {
  label: string;
  value: number;
}

interface StatisticsTableRow {
  coffeeShop: string;
  coffeeShopId?: string | null;
  averageHeadcount: number;
  activeEmployees: number;
  dismissed: number;
  hired: number;
  demand: number;
  demandFromAvg: number;
  turnoverRate: number;
  dismissedUpTo2Weeks: number;
  dismissedUpTo1Month: number;
  dismissedDuringAdaptation: number;
}

type StatisticsColumnKey = keyof StatisticsTableRow;

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface StaffSummaryRowApi {
  coffeeShop?: { id?: string; _id?: string; name?: string | null } | null;
  coffeeShopName?: string | null;
  srspch?: number;
  working?: number;
  dismissed?: number;
  hired?: number;
  need?: number;
  needPercent?: number;
  turnoverRate?: number;
  dismissedUnder14Days?: number;
  dismissedUnder30Days?: number;
  dismissedAtAdaptation?: number;
}

interface StaffSummaryResponse {
  success: boolean;
  data?: {
    rows?: StaffSummaryRowApi[];
  };
}

@Component({
  selector: 'app-checklists-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, TuiIcon, ...TuiDropdown],
  templateUrl: './checklists-statistics.component.html',
  styleUrl: './checklists-statistics.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChecklistsStatisticsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly periodService = inject(ChecklistPeriodService);
  private readonly coffeeShopService = inject(CoffeeShopService);
  private readonly apiUrl = `${environment.apiUrl}/users/staff-summary`;

  searchQuery = '';
  hoveredBar: { chart: string; label: string; value: number; metric: string; x: number; y: number } | null = null;
  selectedCoffeeShops: string[] = [];
  coffeeDropdownOpen = false;
  sortKey: StatisticsColumnKey | null = null;
  sortDirection: 'asc' | 'desc' = 'desc';
  isLoading = false;
  errorMessage = '';
  /** Редактирование СРСПЧ: ключ — coffeeShopId строки */
  editingSrspchKey: string | null = null;
  editingSrspchValue = 0;
  savingSrspch = false;
  srspchError: string | null = null;
  readonly headerColumns: { key: StatisticsColumnKey; label: string }[] = [
    { key: 'coffeeShop', label: 'Название кофейни' },
    { key: 'averageHeadcount', label: 'СРСПЧ' },
    { key: 'activeEmployees', label: 'Работающих' },
    { key: 'dismissed', label: 'Уволено' },
    { key: 'hired', label: 'Принято' },
    { key: 'demand', label: 'Потребность' },
    { key: 'demandFromAvg', label: 'Потребность от СРСПЧ' },
    { key: 'turnoverRate', label: 'КТ' },
    { key: 'dismissedUpTo2Weeks', label: 'Уволено до 2 недель' },
    { key: 'dismissedUpTo1Month', label: 'Уволено до 1 месяца' },
    { key: 'dismissedDuringAdaptation', label: 'Уволено на этапе адаптации' },
  ];

  // ── Bar chart data ────────────────────────────────────────
  chart1: BarItem[] = [];
  chart2: BarItem[] = [];
  chart3: BarItem[] = [];

  statisticsRows: StatisticsTableRow[] = [];

  constructor() {
    this.selectedCoffeeShops = [...this.coffeeShopOptions];
    this.refreshChartsAndDonut();
  }

  ngOnInit(): void {
    this.loadStatistics();
    this.periodService.periodChanges.subscribe(() => this.loadStatistics());
  }

  // ── Donut chart data ──────────────────────────────────────
  donutSegments: DonutSegment[] = [
    { value: 0, color: '#E8E3D8', label: '-' },
    { value: 0, color: '#C8BAA5', label: '-' },
    { value: 0, color: '#3A3730', label: '-' },
    { value: 0, color: '#9E9E9E', label: '-' },
  ];

  donutTotal = 100;

  private readonly DONUT_R = 48;
  private readonly C = 2 * Math.PI * this.DONUT_R; // ≈ 301.59

  // ── Bar chart helpers ─────────────────────────────────────
  /** Chart area height in px (matches .bar-chart__area height in SCSS) */
  private readonly CHART_H = 220;

  get coffeeShopOptions(): string[] {
    return Array.from(new Set(this.statisticsRows.map((row) => row.coffeeShop))).sort((a, b) => a.localeCompare(b, 'ru'));
  }

  get filteredStatisticsRows(): StatisticsTableRow[] {
    const query = this.searchQuery.trim().toLowerCase();

    const filtered = this.statisticsRows.filter((row) => {
      if (this.selectedCoffeeShops.length > 0 && !this.selectedCoffeeShops.includes(row.coffeeShop)) {
        return false;
      }

      if (query) {
        const matchesQuery = Object.values(row).some((value) => String(value).toLowerCase().includes(query));
        if (!matchesQuery) {
          return false;
        }
      }

      return true;
    });

    return this.sortRows(filtered);
  }

  onFiltersChanged(): void {
    this.refreshChartsAndDonut();
  }

  coffeeChipLabel(): string {
    return 'Кофейни';
  }

  isCoffeeSelected(coffee: string): boolean {
    return this.selectedCoffeeShops.includes(coffee);
  }

  toggleCoffee(coffee: string): void {
    this.selectedCoffeeShops = this.selectedCoffeeShops.includes(coffee)
      ? this.selectedCoffeeShops.filter((value) => value !== coffee)
      : [...this.selectedCoffeeShops, coffee];
    this.onFiltersChanged();
  }

  selectAllCoffees(): void {
    this.selectedCoffeeShops = [...this.coffeeShopOptions];
    this.onFiltersChanged();
  }

  clearCoffees(): void {
    this.selectedCoffeeShops = [];
    this.onFiltersChanged();
  }

  toggleSort(key: StatisticsColumnKey): void {
    if (this.sortKey === key) {
      this.sortKey = null;
      this.refreshChartsAndDonut();
      return;
    }
    this.sortKey = key;
    this.sortDirection = 'desc';
    this.refreshChartsAndDonut();
  }

  sortIcon(key: StatisticsColumnKey): string {
    const base = '/assets/images/';
    if (this.sortKey !== key) {
      return base + 'solar_transfer-vertical-outline.svg';
    }
    return this.sortDirection === 'desc'
      ? base + 'solar_sort-from-top-to-bottom-bold.svg'
      : base + 'solar_sort-from-bottom-to-top-bold.svg';
  }

  getTopValue(data: BarItem[]): number {
    if (!data.length) {
      return 5;
    }
    const max = Math.max(...data.map((d) => d.value));
    return Math.ceil(max / 5) * 5 || 5;
  }

  getYTicks(data: BarItem[]): number[] {
    const top = this.getTopValue(data);
    const ticks: number[] = [];
    for (let v = top; v >= 0; v -= 5) ticks.push(v);
    return ticks;
  }

  barPx(value: number, data: BarItem[]): number {
    const top = this.getTopValue(data);
    return Math.round((value / top) * this.CHART_H);
  }

  showBarTooltip(chart: string, item: BarItem, metric: string, event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : event.clientX;
    const y = rect ? rect.top - 8 : event.clientY - 8;

    this.hoveredBar = { chart, label: item.label, value: item.value, metric, x, y };
  }

  hideBarTooltip(chart: string, label: string): void {
    if (this.hoveredBar?.chart === chart && this.hoveredBar.label === label) {
      this.hoveredBar = null;
    }
  }

  isBarHovered(chart: string, label: string): boolean {
    return this.hoveredBar?.chart === chart && this.hoveredBar.label === label;
  }

  tableTotal<K extends keyof StatisticsTableRow>(key: K): number {
    if (key === 'coffeeShop') {
      return 0;
    }
    return this.filteredStatisticsRows.reduce((sum, row) => sum + Number(row[key]), 0);
  }

  isEditingSrspch(row: StatisticsTableRow): boolean {
    return row.coffeeShopId != null && this.editingSrspchKey === row.coffeeShopId;
  }

  canEditSrspch(row: StatisticsTableRow): boolean {
    return row.coffeeShopId != null && row.coffeeShopId.length > 0;
  }

  startEditSrspch(row: StatisticsTableRow): void {
    if (!this.canEditSrspch(row)) {
      return;
    }
    this.editingSrspchKey = row.coffeeShopId ?? null;
    this.editingSrspchValue = row.averageHeadcount;
    this.srspchError = null;
  }

  cancelEditSrspch(): void {
    this.editingSrspchKey = null;
    this.srspchError = null;
  }

  saveSrspch(row: StatisticsTableRow): void {
    const id = row.coffeeShopId;
    if (!id || this.savingSrspch) {
      this.cancelEditSrspch();
      return;
    }
    const value = Math.max(0, Math.round(Number(this.editingSrspchValue)));
    this.savingSrspch = true;
    this.srspchError = null;
    this.coffeeShopService.updateCoffeeShop(id, { srspch: value }).subscribe({
      next: () => {
        row.averageHeadcount = value;
        this.refreshChartsAndDonut();
        this.cancelEditSrspch();
        this.savingSrspch = false;
      },
      error: (err) => {
        this.srspchError = err?.error?.message ?? 'Не удалось сохранить СРСПЧ';
        this.savingSrspch = false;
      },
    });
  }

  // ── Donut chart helpers ───────────────────────────────────
  dasharray(value: number): string {
    if (!this.donutTotal) {
      return `0 ${this.C.toFixed(2)}`;
    }
    const dash = (value / this.donutTotal) * this.C;
    return `${dash.toFixed(2)} ${(this.C - dash).toFixed(2)}`;
  }

  dashoffset(index: number): number {
    if (!this.donutTotal) {
      return this.C / 4;
    }
    let offset = this.C / 4; // start at 12 o'clock
    for (let i = 0; i < index; i++) {
      offset -= (this.donutSegments[i].value / this.donutTotal) * this.C;
    }
    return offset;
  }

  private loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const period = this.periodService.getPeriod();
    let params = new HttpParams();
    if (period.dateFrom) {
      params = params.set('dateFrom', this.toISODateTime(period.dateFrom, true));
    }
    if (period.dateTo) {
      params = params.set('dateTo', this.toISODateTime(period.dateTo, false));
    }

    this.http.get<StaffSummaryResponse>(this.apiUrl, { params }).subscribe({
      next: (response) => {
        const rows = response?.data?.rows ?? [];
        this.statisticsRows = this.buildStatisticsRows(rows);
        this.selectedCoffeeShops = [...this.coffeeShopOptions];
        this.refreshChartsAndDonut();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Не удалось загрузить статистику с сервера';
        this.statisticsRows = [];
        this.selectedCoffeeShops = [];
        this.refreshChartsAndDonut();
        this.isLoading = false;
      },
    });
  }

  private buildStatisticsRows(rows: StaffSummaryRowApi[]): StatisticsTableRow[] {
    return rows
      .map((row) => ({
        coffeeShop: row.coffeeShopName?.trim() || row.coffeeShop?.name?.trim() || 'Без кофейни',
        coffeeShopId: row.coffeeShop?.id ?? (row.coffeeShop as { _id?: string })?._id ?? null,
        averageHeadcount: this.toNumber(row.srspch),
        activeEmployees: this.toNumber(row.working),
        dismissed: this.toNumber(row.dismissed),
        hired: this.toNumber(row.hired),
        demand: this.toNumber(row.need),
        demandFromAvg: Math.round(this.toNumber(row.needPercent)),
        turnoverRate: Math.round(this.toNumber(row.turnoverRate)),
        dismissedUpTo2Weeks: this.toNumber(row.dismissedUnder14Days),
        dismissedUpTo1Month: this.toNumber(row.dismissedUnder30Days),
        dismissedDuringAdaptation: this.toNumber(row.dismissedAtAdaptation),
      }))
      .sort((a, b) => a.coffeeShop.localeCompare(b.coffeeShop, 'ru'));
  }

  private refreshChartsAndDonut(): void {
    const rows = this.filteredStatisticsRows;

    this.chart1 = rows.map((row) => ({ label: row.coffeeShop, value: row.demand }));
    this.chart2 = rows.map((row) => ({ label: row.coffeeShop, value: row.demandFromAvg }));
    this.chart3 = rows.map((row) => ({ label: row.coffeeShop, value: row.turnoverRate }));

    const palette = ['#E8E3D8', '#C8BAA5', '#3A3730', '#9E9E9E'];
    const topDismissed = [...rows]
      .sort((a, b) => b.dismissed - a.dismissed)
      .slice(0, 4);

    const values = topDismissed.map((row) => row.dismissed);
    const total = values.reduce((sum, value) => sum + value, 0);
    this.donutTotal = total || 0;

    const segments = topDismissed.map((row, index) => ({
      label: row.coffeeShop,
      value: row.dismissed,
      color: palette[index] ?? '#9E9E9E',
    }));

    while (segments.length < 4) {
      const index = segments.length;
      segments.push({
        label: '-',
        value: 0,
        color: palette[index] ?? '#9E9E9E',
      });
    }

    this.donutSegments = segments;
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  /** YYYY-MM-DD -> ISO date-time (start or end of day UTC) */
  private toISODateTime(dateStr: string, startOfDay: boolean): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
    if (startOfDay) {
      return date.toISOString();
    }
    date.setUTCHours(23, 59, 59, 999);
    return date.toISOString();
  }

  private sortRows(rows: StatisticsTableRow[]): StatisticsTableRow[] {
    if (!this.sortKey) {
      return rows;
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = a[this.sortKey!];
      const right = b[this.sortKey!];

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * dir;
      }

      return String(left).localeCompare(String(right), 'ru') * dir;
    });
  }
}
