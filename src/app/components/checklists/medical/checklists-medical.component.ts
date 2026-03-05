import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { from } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';


type ReferralStatus = 'passed' | 'issued' | 'expired' | 'san_minimum' | 'no_data';

interface MedicalRow {
  id: string;
  fullName: string;
  coffeeShopName: string;
  referralStatus: ReferralStatus;
  admission: string;
  fluorography: string;
  therapist: string;
  dermatovenerologist: string;
  syphilis: string;
  ent: string;
  dentist: string;
  bacterialTest: string;
  typhoid: string;
  helminths: string;
  staphylococcus: string;
  annualSanMinimum: string;
}

/** Данные карточки сотрудника для PopUp */
interface MedicalCardData {
  userId?: string;
  fullName?: string | null;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  employmentDate?: string | null;
  adaptationCompletedAt?: string | null;
  trainingCenterStartedAt?: string | null;
  trainingCenterCompletedAt?: string | null;
  medicalExamExpiresAt?: string | null;
  terminationDate?: string | null;
  workDuration?: { formatted?: string; human?: string } | null;
  attestationAt?: string | null;
}

interface FullUserData {
  medicalBookAdmissionAt?: string | null;
  medicalBookFluorographyAt?: string | null;
  medicalBookTherapistAt?: string | null;
  medicalBookDermatovenerologistAt?: string | null;
  medicalBookSyphilisAt?: string | null;
  medicalBookLorAt?: string | null;
  medicalBookDentistAt?: string | null;
  medicalBookBacAnalysisAt?: string | null;
  medicalBookTyphoidAt?: string | null;
  medicalBookHelminthsAt?: string | null;
  medicalBookStaphylococcusAt?: string | null;
  medicalBookSanMinimumAt?: string | null;
}

interface MedicalTableApiRow {
  userId?: string;
  fullName?: string | null;
  coffeeShop?: {
    name?: string | null;
  } | null;
  status?: string | null;
  admissionAt?: string | null;
  fluorographyAt?: string | null;
  therapistAt?: string | null;
  dermatovenerologistAt?: string | null;
  syphilisAt?: string | null;
  lorAt?: string | null;
  dentistAt?: string | null;
  bacAnalysisAt?: string | null;
  typhoidAt?: string | null;
  helminthsAt?: string | null;
  staphylococcusAt?: string | null;
  sanMinimumAt?: string | null;
}

interface MedicalTableApiResponse {
  success: boolean;
  data?: {
    rows?: MedicalTableApiRow[];
  };
}

@Component({
  selector: 'app-checklists-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, TuiIcon, ...TuiDropdown],
  templateUrl: './checklists-medical.component.html',
  styleUrl: './checklists-medical.component.scss',
})
export class ChecklistsMedicalComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  sortKey: MedicalSortKey | null = null;
  sortDirection: 'asc' | 'desc' = 'desc';
  isLoading = false;
  error: string | null = null;
  rows: MedicalRow[] = [];

  /** Открытая карточка сотрудника (id пользователя) */
  selectedUserId: string | null = null;
  employeeCardLoading = false;
  employeeCardError: string | null = null;
  employeeForm = this.getEmptyForm();
  savingProfile = false;
  saveProfileError: string | null = null;

  searchQuery = '';
  selectedStatuses: ReferralStatus[] = [];
  selectedCoffeeShops: string[] = [];
  readonly headerColumns: { key: MedicalSortKey; label: string }[] = [
    { key: 'fullName', label: 'ФИО' },
    { key: 'referralStatus', label: 'Статус' },
    { key: 'admission', label: 'Допуск' },
    { key: 'fluorography', label: 'Флюорография' },
    { key: 'therapist', label: 'Терапевт' },
    { key: 'dermatovenerologist', label: 'Дерматовенеролог' },
    { key: 'syphilis', label: 'Сифилис' },
    { key: 'ent', label: 'Лор' },
    { key: 'dentist', label: 'Стоматолог' },
    { key: 'bacterialTest', label: 'Баканализ' },
    { key: 'typhoid', label: 'Брюшной тиф' },
    { key: 'helminths', label: 'Гельминты' },
    { key: 'staphylococcus', label: 'Стафилококк' },
    { key: 'annualSanMinimum', label: 'Санминимум раз в год' },
  ];
  statusDropdownOpen = false;
  coffeeDropdownOpen = false;

  /** Режим редактирования таблицы: кнопка «Редактировать данные» */
  isTableEditMode = false;
  /** Снимок строк для редактирования (копии с датами в формате для инпутов) */
  editTableRows: MedicalRow[] = [];
  /** Исходные значения при входе в режим редактирования (для определения изменений) */
  originalTableRows: MedicalRow[] = [];
  savingTableEdits = false;
  tableEditSaveError: string | null = null;

  /** Строки для отображения: в режиме редактирования — editTableRows, иначе filteredRows */
  get tableEditRows(): MedicalRow[] {
    return this.isTableEditMode ? this.editTableRows : this.filteredRows;
  }

  readonly statusOptions: { value: ReferralStatus; label: string }[] = [
    { value: 'passed', label: 'Пройден' },
    { value: 'issued', label: 'Выдано направление' },
    { value: 'expired', label: 'Просрочен' },
    { value: 'san_minimum', label: 'Сан.Минимум' },
    { value: 'no_data', label: 'Нет данных' },
  ];
  coffeeShopOptions: string[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRows(): MedicalRow[] {
    const query = this.searchQuery.trim().toLowerCase();

    const filtered = this.rows.filter((row) => {
      if (this.selectedStatuses.length > 0 && !this.selectedStatuses.includes(row.referralStatus)) {
        return false;
      }
      if (this.selectedCoffeeShops.length > 0 && !this.selectedCoffeeShops.includes(row.coffeeShopName)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const matchesSearch =
        row.fullName.toLowerCase().includes(query) || row.coffeeShopName.toLowerCase().includes(query);
      if (!matchesSearch) {
        return false;
      }
      return true;
    });

    return this.sortRows(filtered);
  }

  onFiltersChanged(): void {}

  toggleSort(key: MedicalSortKey): void {
    if (this.sortKey !== key) {
      this.sortKey = key;
      this.sortDirection = 'desc';
      return;
    }
    if (this.sortDirection === 'desc') {
      this.sortDirection = 'asc';
      return;
    }
    this.sortKey = null;
    this.sortDirection = 'desc';
  }

  sortIcon(key: MedicalSortKey): string {
    const base = '/assets/images/';
    if (this.sortKey !== key) {
      return base + 'solar_transfer-vertical-outline.svg';
    }
    return this.sortDirection === 'desc'
      ? base + 'solar_sort-from-top-to-bottom-bold.svg'
      : base + 'solar_sort-from-bottom-to-top-bold.svg';
  }

  statusChipLabel(): string {
    return 'Статус';
  }

  coffeeChipLabel(): string {
    return 'Кофейня';
  }

  statusLabel(status: ReferralStatus): string {
    if (status === 'passed') return 'Пройден';
    if (status === 'issued') return 'Выдано направление';
    if (status === 'expired') return 'Просрочен';
    if (status === 'san_minimum') return 'Сан.Минимум';
    return 'Нет данных';
  }

  isStatusSelected(value: ReferralStatus): boolean {
    return this.selectedStatuses.includes(value);
  }

  toggleStatus(value: ReferralStatus): void {
    this.selectedStatuses = this.selectedStatuses.includes(value)
      ? this.selectedStatuses.filter((item) => item !== value)
      : [...this.selectedStatuses, value];
    this.onFiltersChanged();
  }

  selectAllStatuses(): void {
    this.selectedStatuses = this.statusOptions.map((item) => item.value);
    this.onFiltersChanged();
  }

  clearStatuses(): void {
    this.selectedStatuses = [];
    this.onFiltersChanged();
  }

  isCoffeeSelected(value: string): boolean {
    return this.selectedCoffeeShops.includes(value);
  }

  toggleCoffee(value: string): void {
    this.selectedCoffeeShops = this.selectedCoffeeShops.includes(value)
      ? this.selectedCoffeeShops.filter((item) => item !== value)
      : [...this.selectedCoffeeShops, value];
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

  /** Включить режим редактирования таблицы */
  startTableEdit(): void {
    const rows = this.filteredRows;
    this.editTableRows = rows.map((r) => ({
      ...r,
      admission: this.tableCellToEditValue(r.admission),
      fluorography: this.tableCellToEditValue(r.fluorography),
      therapist: this.tableCellToEditValue(r.therapist),
      dermatovenerologist: this.tableCellToEditValue(r.dermatovenerologist),
      syphilis: this.tableCellToEditValue(r.syphilis),
      ent: this.tableCellToEditValue(r.ent),
      dentist: this.tableCellToEditValue(r.dentist),
      bacterialTest: this.tableCellToEditValue(r.bacterialTest),
      typhoid: this.tableCellToEditValue(r.typhoid),
      helminths: this.tableCellToEditValue(r.helminths),
      staphylococcus: this.tableCellToEditValue(r.staphylococcus),
      annualSanMinimum: this.tableCellToEditValue(r.annualSanMinimum),
    }));
    this.originalTableRows = this.editTableRows.map((r) => ({ ...r }));
    this.isTableEditMode = true;
    this.tableEditSaveError = null;
  }

  /** Отменить редактирование таблицы */
  cancelTableEdit(): void {
    this.isTableEditMode = false;
    this.editTableRows = [];
    this.originalTableRows = [];
    this.tableEditSaveError = null;
  }

  /** Сохранить изменения таблицы: PATCH только по строкам с изменениями, в теле только изменённые поля */
  saveTableEdits(): void {
    this.savingTableEdits = true;
    this.tableEditSaveError = null;
    const apiKeyByRowKey: Record<string, string> = {
      admission: 'medicalBookAdmissionAt',
      fluorography: 'medicalBookFluorographyAt',
      therapist: 'medicalBookTherapistAt',
      dermatovenerologist: 'medicalBookDermatovenerologistAt',
      syphilis: 'medicalBookSyphilisAt',
      ent: 'medicalBookLorAt',
      dentist: 'medicalBookDentistAt',
      bacterialTest: 'medicalBookBacAnalysisAt',
      typhoid: 'medicalBookTyphoidAt',
      helminths: 'medicalBookHelminthsAt',
      staphylococcus: 'medicalBookStaphylococcusAt',
      annualSanMinimum: 'medicalBookSanMinimumAt',
    };
    const medicalDateKeys: (keyof MedicalRow)[] = [
      'admission', 'fluorography', 'therapist', 'dermatovenerologist', 'syphilis',
      'ent', 'dentist', 'bacterialTest', 'typhoid', 'helminths', 'staphylococcus', 'annualSanMinimum',
    ];
    const toSave: { row: MedicalRow; body: Record<string, string | null> }[] = [];
    for (let i = 0; i < this.editTableRows.length; i++) {
      const row = this.editTableRows[i];
      const orig = this.originalTableRows[i];
      if (!orig) continue;
      const body: Record<string, string | null> = {};
      for (const key of medicalDateKeys) {
        const current = this.normalizeDateForCompare(row[key] ?? '');
        const prev = this.normalizeDateForCompare(orig[key] ?? '');
        if (current !== prev) {
          const apiKey = apiKeyByRowKey[key as string];
          body[apiKey] = this.dateFieldForApi(row[key] ?? '');
        }
      }
      if (Object.keys(body).length > 0) {
        toSave.push({ row, body });
      }
    }
    if (toSave.length === 0) {
      this.savingTableEdits = false;
      this.isTableEditMode = false;
      this.editTableRows = [];
      this.originalTableRows = [];
      this.loadData();
      return;
    }
    from(toSave)
      .pipe(
        concatMap(({ row, body }) =>
          this.http.patch<{ success: boolean }>(`${this.apiUrl}/${row.id}/staff-profile`, body).pipe(delay(300))
        )
      )
      .subscribe({
        next: () => {},
        complete: () => {
          this.savingTableEdits = false;
          this.isTableEditMode = false;
          this.editTableRows = [];
          this.originalTableRows = [];
          this.loadData();
        },
        error: (err) => {
          this.savingTableEdits = false;
          this.tableEditSaveError = err?.error?.message ?? 'Не удалось сохранить изменения';
        },
      });
  }

  /** Нормализация значения даты для сравнения (пусто / "—" / пробелы → "") */
  private normalizeDateForCompare(value: string): string {
    const v = (value ?? '').trim();
    return v === '—' ? '' : v;
  }

  /** Значение ячейки таблицы → для инпута (пусто или ДД.ММ.ГГГГ) */
  private tableCellToEditValue(value: string): string {
    if (!value || value.trim() === '' || value.trim() === '—') return '';
    return this.backendDateToForm(value);
  }

  openEmployeeModal(row: MedicalRow): void {
    this.selectedUserId = row.id;
    this.employeeForm = this.getEmptyForm();
    this.employeeCardError = null;
    this.saveProfileError = null;
    this.employeeForm.fullName = row.fullName;
    this.employeeForm.medicalBookAdmissionAt = row.admission === '—' ? '' : row.admission;
    this.employeeForm.medicalBookFluorographyAt = row.fluorography === '—' ? '' : row.fluorography;
    this.employeeForm.medicalBookTherapistAt = row.therapist === '—' ? '' : row.therapist;
    this.employeeForm.medicalBookDermatovenerologistAt = row.dermatovenerologist === '—' ? '' : row.dermatovenerologist;
    this.employeeForm.medicalBookSyphilisAt = row.syphilis === '—' ? '' : row.syphilis;
    this.employeeForm.medicalBookLorAt = row.ent === '—' ? '' : row.ent;
    this.employeeForm.medicalBookDentistAt = row.dentist === '—' ? '' : row.dentist;
    this.employeeForm.medicalBookBacAnalysisAt = row.bacterialTest === '—' ? '' : row.bacterialTest;
    this.employeeForm.medicalBookTyphoidAt = row.typhoid === '—' ? '' : row.typhoid;
    this.employeeForm.medicalBookHelminthsAt = row.helminths === '—' ? '' : row.helminths;
    this.employeeForm.medicalBookStaphylococcusAt = row.staphylococcus === '—' ? '' : row.staphylococcus;
    this.employeeForm.medicalBookSanMinimumAt = row.annualSanMinimum === '—' ? '' : row.annualSanMinimum;
    this.loadEmployeeCard(row.id);
  }

  closeEmployeeModal(): void {
    this.selectedUserId = null;
    this.employeeCardLoading = false;
    this.employeeCardError = null;
    this.savingProfile = false;
    this.saveProfileError = null;
  }

  /** Очистить поле даты в форме */
  clearDateField(key: keyof ChecklistsMedicalComponent['employeeForm']): void {
    if (key === 'workDurationFormatted') return;
    (this.employeeForm as Record<string, string>)[key] = '';
  }

  loadEmployeeCard(userId: string): void {
    this.employeeCardLoading = true;
    this.employeeCardError = null;

    this.http.get<{ success: boolean; data?: MedicalCardData }>(`${this.apiUrl}/${userId}/medical-card`).subscribe({
      next: (res) => {
        const data = res.data;
        if (data) {
          this.employeeForm.fullName = data.fullName?.trim() ?? this.employeeForm.fullName;
          this.employeeForm.birthDate = this.backendDateToForm(data.birthDate);
          this.employeeForm.phone = data.phone?.trim() ?? '';
          this.employeeForm.email = data.email?.trim() ?? '';
          this.employeeForm.terminationDate = this.backendDateToForm(data.terminationDate);
          this.employeeForm.employmentDate = this.backendDateToForm(data.employmentDate);
          this.employeeForm.adaptationCompletedAt = this.backendDateToForm(data.adaptationCompletedAt);
          this.employeeForm.trainingCenterStartedAt = this.backendDateToForm(data.trainingCenterStartedAt);
          this.employeeForm.trainingCenterCompletedAt = this.backendDateToForm(data.trainingCenterCompletedAt);
          this.employeeForm.attestationDate = this.backendDateToForm(data.trainingCenterCompletedAt);
          this.employeeForm.medicalExamExpiresAt = this.backendDateToForm(data.medicalExamExpiresAt);
          this.employeeForm.workDurationFormatted = data.workDuration?.human ?? data.workDuration?.formatted ?? '—';
        }
        this.employeeCardLoading = false;
      },
      error: () => {
        this.employeeCardError = 'Не удалось загрузить карточку сотрудника';
        this.employeeCardLoading = false;
      },
    });
  }

  saveEmployeeProfile(): void {
    const userId = this.selectedUserId;
    if (!userId) return;

    this.savingProfile = true;
    this.saveProfileError = null;

    const body: Record<string, string | null | undefined> = {
      fullName: this.employeeForm.fullName || undefined,
      birthDate: this.dateFieldForApi(this.employeeForm.birthDate),
      phone: this.employeeForm.phone || undefined,
      email: this.employeeForm.email || undefined,
      terminationDate: this.dateFieldForApi(this.employeeForm.terminationDate),
      employmentDate: this.dateFieldForApi(this.employeeForm.employmentDate),
      adaptationCompletedAt: this.dateFieldForApi(this.employeeForm.adaptationCompletedAt),
      trainingCenterStartedAt: this.dateFieldForApi(this.employeeForm.trainingCenterStartedAt),
      trainingCenterCompletedAt: this.dateFieldForApi(this.employeeForm.attestationDate),
      medicalExamExpiresAt: this.dateFieldForApi(this.employeeForm.medicalExamExpiresAt),
      medicalBookAdmissionAt: this.dateFieldForApi(this.employeeForm.medicalBookAdmissionAt),
      medicalBookDentistAt: this.dateFieldForApi(this.employeeForm.medicalBookDentistAt),
      medicalBookBacAnalysisAt: this.dateFieldForApi(this.employeeForm.medicalBookBacAnalysisAt),
      medicalBookFluorographyAt: this.dateFieldForApi(this.employeeForm.medicalBookFluorographyAt),
      medicalBookTyphoidAt: this.dateFieldForApi(this.employeeForm.medicalBookTyphoidAt),
      medicalBookTherapistAt: this.dateFieldForApi(this.employeeForm.medicalBookTherapistAt),
      medicalBookDermatovenerologistAt: this.dateFieldForApi(this.employeeForm.medicalBookDermatovenerologistAt),
      medicalBookHelminthsAt: this.dateFieldForApi(this.employeeForm.medicalBookHelminthsAt),
      medicalBookSyphilisAt: this.dateFieldForApi(this.employeeForm.medicalBookSyphilisAt),
      medicalBookStaphylococcusAt: this.dateFieldForApi(this.employeeForm.medicalBookStaphylococcusAt),
      medicalBookLorAt: this.dateFieldForApi(this.employeeForm.medicalBookLorAt),
      medicalBookSanMinimumAt: this.dateFieldForApi(this.employeeForm.medicalBookSanMinimumAt),
    };

    this.http.patch<{ success: boolean }>(`${this.apiUrl}/${userId}/staff-profile`, body).subscribe({
      next: () => {
        this.savingProfile = false;
        this.loadData();
        this.closeEmployeeModal();
      },
      error: (err) => {
        this.savingProfile = false;
        this.saveProfileError = err?.error?.message ?? 'Не удалось сохранить изменения';
      },
    });
  }

  private getEmptyForm() {
    const empty = '';
    return {
      fullName: empty,
      birthDate: empty,
      phone: empty,
      email: empty,
      terminationDate: empty,
      employmentDate: empty,
      adaptationCompletedAt: empty,
      trainingCenterStartedAt: empty,
      trainingCenterCompletedAt: empty,
      attestationDate: empty,
      medicalExamExpiresAt: empty,
      workDurationFormatted: '—',
      medicalBookNumber: empty,
      medicalBookAdmissionAt: empty,
      medicalBookDentistAt: empty,
      medicalBookBacAnalysisAt: empty,
      medicalBookFluorographyAt: empty,
      medicalBookTyphoidAt: empty,
      medicalBookTherapistAt: empty,
      medicalBookDermatovenerologistAt: empty,
      medicalBookHelminthsAt: empty,
      medicalBookSyphilisAt: empty,
      medicalBookStaphylococcusAt: empty,
      medicalBookLorAt: empty,
      medicalBookSanMinimumAt: empty,
    };
  }

  /** Бэкенд отдаёт DD:MM:YYYY или ISO — в инпутах всегда DD.MM.YYYY */
  private backendDateToForm(value: string | null | undefined): string {
    if (!value?.trim()) return '';
    const s = value.trim();
    if (s.includes(':') && !s.includes('T')) {
      const [d, m, y] = s.split(':');
      return [d, m, y].filter(Boolean).join('.') || '';
    }
    const isoNormalized = s.replace(/T(\d{2})\.(\d{2})\.(\d{2})/, 'T$1:$2:$3');
    const date = new Date(isoNormalized);
    if (Number.isNaN(date.getTime())) return '';
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}.${month}.${year}`;
  }

  private formDateToBackend(value: string): string | undefined {
    if (!value?.trim()) return undefined;
    const trimmed = value.trim();
    const normalized = trimmed.replace(/\./g, ':');
    if (/^\d{1,2}:\d{1,2}:\d{4}$/.test(normalized)) return normalized;
    const [d, m, y] = trimmed.split(/[.:/]/);
    if (d && m && y) return `${d.padStart(2, '0')}:${m.padStart(2, '0')}:${y}`;
    return undefined;
  }

  /** Для PATCH: пустое поле даты — null; иначе ISO YYYY-MM-DD (бэкенд возвращает даты в ISO) */
  private dateFieldForApi(value: string): string | null {
    if (!value?.trim()) return null;
    return this.formDateToISO(value) ?? null;
  }

  /** Форма DD.MM.YYYY или DD:MM:YYYY → ISO YYYY-MM-DD для API */
  private formDateToISO(value: string): string | undefined {
    if (!value?.trim()) return undefined;
    const trimmed = value.trim();
    const [d, m, y] = trimmed.split(/[.:/]/);
    if (!d || !m || !y) return undefined;
    const day = Number(d);
    const month = Number(m);
    const year = Number(y);
    if (day < 1 || day > 31 || month < 1 || month > 12 || !Number.isFinite(year)) return undefined;
    const yy = year < 100 ? 2000 + year : year;
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  private loadData(): void {
    this.isLoading = true;
    this.error = null;

    const params = new HttpParams().set('page', '1').set('limit', '500');
    this.http.get<MedicalTableApiResponse>(`${this.apiUrl}/medical-table`, { params }).subscribe({
      next: (response) => {
        const backendRows = response.data?.rows ?? [];
        this.rows = backendRows.map((row) => this.mapRow(row));
        this.coffeeShopOptions = Array.from(new Set(this.rows.map((row) => row.coffeeShopName))).sort((a, b) =>
          a.localeCompare(b, 'ru')
        );
        this.selectAllStatuses();
        this.selectAllCoffees();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Не удалось загрузить медосмотры сотрудников';
        this.rows = [];
        this.coffeeShopOptions = [];
        this.isLoading = false;
      },
    });
  }

  private sortRows(rows: MedicalRow[]): MedicalRow[] {
    if (!this.sortKey) {
      return rows;
    }
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      const left = this.getSortValue(a, this.sortKey!);
      const right = this.getSortValue(b, this.sortKey!);

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * dir;
      }
      return String(left).localeCompare(String(right), 'ru') * dir;
    });
  }

  private getSortValue(
    row: MedicalRow,
    key: MedicalSortKey
  ): string | number {
    if (key === 'fullName') return `${row.fullName} ${row.coffeeShopName}`;
    if (key === 'referralStatus') return this.statusLabel(row.referralStatus);
    return this.parseDateValue((row as any)[key]);
  }

  private parseDateValue(value: string): number {
    if (!value || value === '—') {
      return 0;
    }
    const [day, month, year] = value.split('.');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private mapRow(row: MedicalTableApiRow): MedicalRow {
    return {
      id: row.userId || `${Math.random()}`,
      fullName: row.fullName?.trim() || 'Без имени',
      coffeeShopName: row.coffeeShop?.name?.trim() || 'Без кофейни',
      referralStatus: this.mapStatus(row.status),
      admission: this.safeDate(row.admissionAt),
      fluorography: this.safeDate(row.fluorographyAt),
      therapist: this.safeDate(row.therapistAt),
      dermatovenerologist: this.safeDate(row.dermatovenerologistAt),
      syphilis: this.safeDate(row.syphilisAt),
      ent: this.safeDate(row.lorAt),
      dentist: this.safeDate(row.dentistAt),
      bacterialTest: this.safeDate(row.bacAnalysisAt),
      typhoid: this.safeDate(row.typhoidAt),
      helminths: this.safeDate(row.helminthsAt),
      staphylococcus: this.safeDate(row.staphylococcusAt),
      annualSanMinimum: this.safeDate(row.sanMinimumAt),
    };
  }

  private mapStatus(value: string | null | undefined): ReferralStatus {
    if (value === 'Пройден') return 'passed';
    if (value === 'Выдано направление') return 'issued';
    if (value === 'Просрочен') return 'expired';
    if (value === 'Сан.Минимум') return 'san_minimum';
    return 'no_data';
  }

  private safeDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const trimmed = value.trim();
    return trimmed || '—';
  }
}

type MedicalSortKey =
  | 'fullName'
  | 'referralStatus'
  | 'admission'
  | 'fluorography'
  | 'therapist'
  | 'dermatovenerologist'
  | 'syphilis'
  | 'ent'
  | 'dentist'
  | 'bacterialTest'
  | 'typhoid'
  | 'helminths'
  | 'staphylococcus'
  | 'annualSanMinimum';
