import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { environment } from '../../../../environments/environment';

type MedicalStatus = 'passed' | 'pending' | 'blocked' | 'no_data';
type PersonnelRole = 'trainee' | 'barista' | 'supervisor' | 'manager' | 'admin';

interface EmployeeRow {
  id: string;
  fullName: string;
  coffeeShopName: string;
  role: PersonnelRole;
  employmentDate: Date | null;
  adaptationEndDate: Date | null;
  trainingStartDate: Date | null;
  attestationDate: Date | null;
  medicalEndDate: Date | null;
  dismissalDate: Date | null;
  medicalStatus: MedicalStatus;
}

/** Данные карточки сотрудника для PopUp (GET /api/users/{id}/medical-card) */
interface MedicalCardData {
  userId?: string;
  fullName?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  patronymic?: string | null;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  coffeeShop?: { id?: string; name?: string | null } | null;
  position?: string | null;
  role?: string | null;
  employmentDate?: string | null;
  adaptationCompletedAt?: string | null;
  trainingCenterStartedAt?: string | null;
  trainingCenterCompletedAt?: string | null;
  medicalExamExpiresAt?: string | null;
  terminationDate?: string | null;
  workDuration?: { formatted?: string; human?: string } | null;
  attestationAt?: string | null;
}

/** Полный пользователь (GET /api/users/{id}) — для полей медкнижки */
interface FullUserData {
  id?: string;
  fullName?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  patronymic?: string | null;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  employmentDate?: string | null;
  adaptationCompletedAt?: string | null;
  trainingCenterStartedAt?: string | null;
  trainingCenterCompletedAt?: string | null;
  medicalExamExpiresAt?: string | null;
  terminationDate?: string | null;
  attestationAt?: string | null;
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

interface StaffTableApiRow {
  userId?: string;
  id?: string;
  fullName?: string | null;
  coffeeShopName?: string | null;
  role?: string | null;
  position?: string | null;
  employmentDate?: string | null;
  adaptationCompletedAt?: string | null;
  trainingCenterStartedAt?: string | null;
  trainingCenterCompletedAt?: string | null;
  medicalExamExpiresAt?: string | null;
  terminationDate?: string | null;
  medicalExamStatus?: {
    status?: string | null;
  } | null;
}

interface StaffTableApiResponse {
  success: boolean;
  data?: {
    rows?: StaffTableApiRow[];
  };
}

@Component({
  selector: 'app-checklists-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TuiIcon, ...TuiDropdown],
  templateUrl: './checklists-personnel.component.html',
  styleUrl: './checklists-personnel.component.scss',
})
export class ChecklistsPersonnelComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private observer: IntersectionObserver | null = null;
  private observedAnchor: HTMLElement | null = null;

  sortKey: PersonnelSortKey | null = null;
  sortDirection: 'asc' | 'desc' = 'desc';
  isLoading = false;
  error: string | null = null;

  rows: EmployeeRow[] = [];
  coffeeShopOptions: string[] = [];
  selectedEmployee: EmployeeRow | null = null;

  /** Загрузка карточки сотрудника */
  employeeCardLoading = false;
  employeeCardError: string | null = null;
  /** Модель формы редактирования (все поля в формате DD.MM.YYYY для дат) */
  employeeForm: {
    fullName: string;
    birthDate: string;
    phone: string;
    email: string;
    terminationDate: string;
    employmentDate: string;
    adaptationCompletedAt: string;
    trainingCenterStartedAt: string;
    trainingCenterCompletedAt: string;
    attestationDate: string;
    medicalExamExpiresAt: string;
    workDurationFormatted: string;
    medicalBookNumber: string;
    medicalBookAdmissionAt: string;
    medicalBookDentistAt: string;
    medicalBookBacAnalysisAt: string;
    medicalBookFluorographyAt: string;
    medicalBookTyphoidAt: string;
    medicalBookTherapistAt: string;
    medicalBookDermatovenerologistAt: string;
    medicalBookHelminthsAt: string;
    medicalBookSyphilisAt: string;
    medicalBookStaphylococcusAt: string;
    medicalBookLorAt: string;
    medicalBookSanMinimumAt: string;
  } = this.getEmptyForm();
  savingProfile = false;
  saveProfileError: string | null = null;

  searchQuery = '';
  selectedRoles: PersonnelRole[] = [];
  selectedStatuses: MedicalStatus[] = [];
  selectedCoffeeShops: string[] = [];
  readonly headerColumns: { key: PersonnelSortKey; label: string }[] = [
    { key: 'fullName', label: 'ФИО' },
    { key: 'coffeeShopName', label: 'Название кофейни' },
    { key: 'role', label: 'Должность работника' },
    { key: 'employmentDate', label: 'Дата трудоустройства' },
    { key: 'adaptationEndDate', label: 'Дата завершения адаптации' },
    { key: 'trainingStartDate', label: 'Дата начала обучения' },
    { key: 'attestationDate', label: 'Аттестация' },
    { key: 'medicalStatus', label: 'Статус медосмотра' },
    { key: 'medicalEndDate', label: 'Дата окончания медосмотра' },
    { key: 'dismissalDate', label: 'Дата увольнения' },
  ];

  roleDropdownOpen = false;
  statusDropdownOpen = false;
  coffeeDropdownOpen = false;

  visibleRowsCount = 30;
  readonly lazyStep = 30;
  @ViewChild('loadMoreAnchor')
  set loadMoreAnchor(ref: ElementRef<HTMLElement> | undefined) {
    this.observeAnchor(ref);
  }

  @ViewChild('tableCard')
  tableCard?: ElementRef<HTMLDivElement>;

  @ViewChild('bottomScroller')
  bottomScroller?: ElementRef<HTMLDivElement>;

  tableHasHorizontalScroll = false;
  tableScrollWidth = 0;

  readonly roleOptions: { value: PersonnelRole; label: string }[] = [
    { value: 'trainee', label: 'Стажер' },
    { value: 'barista', label: 'Бариста' },
    { value: 'supervisor', label: 'Управляющий' },
    { value: 'manager', label: 'Менеджер' },
    { value: 'admin', label: 'Администратор' },
  ];
  readonly statusOptions: { value: MedicalStatus; label: string }[] = [
    { value: 'passed', label: 'Медосмотр пройден' },
    { value: 'pending', label: 'Нужно пройти медосмотр' },
    { value: 'blocked', label: 'Нельзя допускать до работы' },
    { value: 'no_data', label: 'Нет данных' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
    this.updateHorizontalScrollState();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateHorizontalScrollState();
  }

  get filteredRows(): EmployeeRow[] {
    const query = this.searchQuery.trim().toLowerCase();

    const filtered = this.rows.filter((row) => {
      if (this.selectedRoles.length > 0 && !this.selectedRoles.includes(row.role)) {
        return false;
      }
      if (this.selectedStatuses.length > 0 && !this.selectedStatuses.includes(row.medicalStatus)) {
        return false;
      }
      if (this.selectedCoffeeShops.length > 0 && !this.selectedCoffeeShops.includes(row.coffeeShopName)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const matchesSearch =
        row.fullName.toLowerCase().includes(query) ||
        row.coffeeShopName.toLowerCase().includes(query) ||
        this.roleLabel(row.role).toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      return true;
    });

    return this.sortRows(filtered);
  }

  get displayedRows(): EmployeeRow[] {
    return this.filteredRows.slice(0, this.visibleRowsCount);
  }

  get hiddenRowsCount(): number {
    return Math.max(0, this.filteredRows.length - this.displayedRows.length);
  }

  onFiltersChanged(): void {
    this.visibleRowsCount = this.lazyStep;
  }

  toggleSort(key: PersonnelSortKey): void {
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

  sortIcon(key: PersonnelSortKey): string {
    const base = '/assets/images/';
    if (this.sortKey !== key) {
      return base + 'solar_transfer-vertical-outline.svg';
    }
    return this.sortDirection === 'desc'
      ? base + 'solar_sort-from-top-to-bottom-bold.svg'
      : base + 'solar_sort-from-bottom-to-top-bold.svg';
  }

  roleChipLabel(): string {
    return 'Должность';
  }

  statusChipLabel(): string {
    return 'Статус медосмотра';
  }

  coffeeChipLabel(): string {
    return 'Кофейни';
  }

  isRoleSelected(role: PersonnelRole): boolean {
    return this.selectedRoles.includes(role);
  }

  isStatusSelected(status: MedicalStatus): boolean {
    return this.selectedStatuses.includes(status);
  }

  isCoffeeSelected(coffee: string): boolean {
    return this.selectedCoffeeShops.includes(coffee);
  }

  toggleRole(role: PersonnelRole): void {
    this.selectedRoles = this.selectedRoles.includes(role)
      ? this.selectedRoles.filter((value) => value !== role)
      : [...this.selectedRoles, role];
    this.onFiltersChanged();
  }

  toggleStatus(status: MedicalStatus): void {
    this.selectedStatuses = this.selectedStatuses.includes(status)
      ? this.selectedStatuses.filter((value) => value !== status)
      : [...this.selectedStatuses, status];
    this.onFiltersChanged();
  }

  toggleCoffee(coffee: string): void {
    this.selectedCoffeeShops = this.selectedCoffeeShops.includes(coffee)
      ? this.selectedCoffeeShops.filter((value) => value !== coffee)
      : [...this.selectedCoffeeShops, coffee];
    this.onFiltersChanged();
  }

  selectAllRoles(): void {
    this.selectedRoles = this.roleOptions.map((option) => option.value);
    this.onFiltersChanged();
  }

  clearRoles(): void {
    this.selectedRoles = [];
    this.onFiltersChanged();
  }

  selectAllStatuses(): void {
    this.selectedStatuses = this.statusOptions.map((option) => option.value);
    this.onFiltersChanged();
  }

  clearStatuses(): void {
    this.selectedStatuses = [];
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

  roleLabel(role: PersonnelRole): string {
    if (role === 'trainee') return 'Стажер';
    if (role === 'supervisor') return 'Управляющий';
    if (role === 'manager') return 'Менеджер';
    if (role === 'admin') return 'Администратор';
    return 'Бариста';
  }

  statusLabel(status: MedicalStatus): string {
    if (status === 'passed') return 'Медосмотр пройден';
    if (status === 'pending') return 'Нужно пройти медосмотр';
    if (status === 'blocked') return 'Нельзя допускать до работы';
    return 'Нет данных';
  }

  formatDate(date: Date | null): string {
    if (!date || Number.isNaN(date.getTime())) {
      return '—';
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  openEmployeeModal(row: EmployeeRow): void {
    this.selectedEmployee = row;
    this.employeeForm = this.getEmptyForm();
    this.employeeCardError = null;
    this.saveProfileError = null;
    this.loadEmployeeCard(row.id);
  }

  closeEmployeeModal(): void {
    this.selectedEmployee = null;
    this.employeeCardLoading = false;
    this.employeeCardError = null;
    this.savingProfile = false;
    this.saveProfileError = null;
  }

  /** Очистить поле даты в форме (для кнопки «удалить дату») */
  clearDateField(key: keyof ChecklistsPersonnelComponent['employeeForm']): void {
    if (key === 'workDurationFormatted') return;
    (this.employeeForm as Record<string, string>)[key] = '';
  }

  /** Загрузить карточку сотрудника (medical-card + при возможности full user для медполей) */
  loadEmployeeCard(userId: string): void {
    this.employeeCardLoading = true;
    this.employeeCardError = null;

    this.http.get<{ success: boolean; data?: MedicalCardData }>(`${this.apiUrl}/${userId}/medical-card`).subscribe({
      next: (res) => {
        const data = res.data;
        if (data) {
          this.employeeForm = {
            fullName: data.fullName?.trim() ?? '',
            birthDate: this.backendDateToForm(data.birthDate),
            phone: data.phone?.trim() ?? '',
            email: data.email?.trim() ?? '',
            terminationDate: this.backendDateToForm(data.terminationDate),
            employmentDate: this.backendDateToForm(data.employmentDate),
            adaptationCompletedAt: this.backendDateToForm(data.adaptationCompletedAt),
            trainingCenterStartedAt: this.backendDateToForm(data.trainingCenterStartedAt),
            trainingCenterCompletedAt: this.backendDateToForm(data.trainingCenterCompletedAt),
            attestationDate: this.backendDateToForm(data.trainingCenterCompletedAt),
            medicalExamExpiresAt: this.backendDateToForm(data.medicalExamExpiresAt),
            workDurationFormatted: data.workDuration?.human ?? data.workDuration?.formatted ?? '—',
            medicalBookNumber: '',
            medicalBookAdmissionAt: '',
            medicalBookDentistAt: '',
            medicalBookBacAnalysisAt: '',
            medicalBookFluorographyAt: '',
            medicalBookTyphoidAt: '',
            medicalBookTherapistAt: '',
            medicalBookHelminthsAt: '',
            medicalBookSyphilisAt: '',
            medicalBookStaphylococcusAt: '',
            medicalBookLorAt: '',
            medicalBookSanMinimumAt: '',
            medicalBookDermatovenerologistAt: '',
          };
        }
        this.employeeCardLoading = false;
        // Догрузить полного пользователя для полей медкнижки (доступно admin)
        this.http.get<{ success: boolean; data?: { user?: FullUserData } }>(`${this.apiUrl}/${userId}`).subscribe({
          next: (userRes) => {
            const user = userRes.data?.user;
            if (user) {
              this.employeeForm.attestationDate = this.backendDateToForm(user.trainingCenterCompletedAt);
              this.employeeForm.trainingCenterCompletedAt = this.backendDateToForm(user.trainingCenterCompletedAt);
              this.employeeForm.medicalBookAdmissionAt = this.backendDateToForm(user.medicalBookAdmissionAt);
              this.employeeForm.medicalBookDentistAt = this.backendDateToForm(user.medicalBookDentistAt);
              this.employeeForm.medicalBookBacAnalysisAt = this.backendDateToForm(user.medicalBookBacAnalysisAt);
              this.employeeForm.medicalBookFluorographyAt = this.backendDateToForm(user.medicalBookFluorographyAt);
              this.employeeForm.medicalBookTyphoidAt = this.backendDateToForm(user.medicalBookTyphoidAt);
              this.employeeForm.medicalBookTherapistAt = this.backendDateToForm(user.medicalBookTherapistAt);
              this.employeeForm.medicalBookDermatovenerologistAt = this.backendDateToForm(user.medicalBookDermatovenerologistAt);
              this.employeeForm.medicalBookHelminthsAt = this.backendDateToForm(user.medicalBookHelminthsAt);
              this.employeeForm.medicalBookSyphilisAt = this.backendDateToForm(user.medicalBookSyphilisAt);
              this.employeeForm.medicalBookStaphylococcusAt = this.backendDateToForm(user.medicalBookStaphylococcusAt);
              this.employeeForm.medicalBookLorAt = this.backendDateToForm(user.medicalBookLorAt);
              this.employeeForm.medicalBookSanMinimumAt = this.backendDateToForm(user.medicalBookSanMinimumAt);
            }
          },
          error: () => {},
        });
      },
      error: () => {
        this.employeeCardError = 'Не удалось загрузить карточку сотрудника';
        this.employeeCardLoading = false;
      },
    });
  }

  saveEmployeeProfile(): void {
    const row = this.selectedEmployee;
    if (!row?.id) return;

    this.savingProfile = true;
    this.saveProfileError = null;

    const body: Record<string, string | number | null | undefined> = {
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

    this.http.patch<{ success: boolean }>(`${this.apiUrl}/${row.id}/staff-profile`, body).subscribe({
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

  /** Бэкенд отдаёт DD:MM:YYYY или ISO (например 2000-11-01T00:00:00.000Z) — в инпутах всегда DD.MM.YYYY */
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

  /** Для PATCH: пустое поле даты — null; иначе ISO YYYY-MM-DD (бэкенд GET /api/users возвращает ISO) */
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

  /** Форма DD.MM.YYYY → для API DD.MM.YYYY (документация: ISO или DD:MM:YYYY) */
  private formDateToBackend(value: string): string | undefined {
    if (!value?.trim()) return undefined;
    const trimmed = value.trim();
    const normalized = trimmed.replace(/\./g, ':');
    if (/^\d{1,2}:\d{1,2}:\d{4}$/.test(normalized)) return normalized;
    const [d, m, y] = trimmed.split(/[.:/]/);
    if (d && m && y) return `${d.padStart(2, '0')}:${m.padStart(2, '0')}:${y}`;
    return undefined;
  }

  loadMoreRows(): void {
    const nextCount = this.visibleRowsCount + this.lazyStep;
    this.visibleRowsCount = Math.min(nextCount, this.filteredRows.length);
    this.updateHorizontalScrollState();
  }

  private loadData(): void {
    this.isLoading = true;
    this.error = null;

    const params = new HttpParams().set('page', '1').set('limit', '500');
    this.http.get<StaffTableApiResponse>(`${this.apiUrl}/staff-table`, { params }).subscribe({
      next: (response) => {
        const backendRows = response.data?.rows ?? [];
        this.rows = backendRows.map((row) => this.mapRow(row));
        this.coffeeShopOptions = Array.from(new Set(this.rows.map((row) => row.coffeeShopName))).sort((a, b) =>
          a.localeCompare(b, 'ru')
        );
        this.selectAllRoles();
        this.selectAllStatuses();
        this.selectAllCoffees();
        this.visibleRowsCount = this.lazyStep;
        this.isLoading = false;
        setTimeout(() => this.updateHorizontalScrollState());
      },
      error: () => {
        this.error = 'Не удалось загрузить сотрудников';
        this.rows = [];
        this.coffeeShopOptions = [];
        this.visibleRowsCount = this.lazyStep;
        this.isLoading = false;
        setTimeout(() => this.updateHorizontalScrollState());
      },
    });
  }

  private setupObserver(): void {
    if (this.observer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && this.hiddenRowsCount > 0) {
        this.loadMoreRows();
      }
    });
  }

  private observeAnchor(ref: ElementRef<HTMLElement> | undefined): void {
    if (this.observedAnchor) {
      this.observer?.unobserve(this.observedAnchor);
      this.observedAnchor = null;
    }

    if (!ref?.nativeElement) {
      return;
    }

    this.setupObserver();
    this.observedAnchor = ref.nativeElement;
    this.observer?.observe(this.observedAnchor);
  }

  private sortRows(rows: EmployeeRow[]): EmployeeRow[] {
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
    row: EmployeeRow,
    key: PersonnelSortKey
  ): string | number {
    if (key === 'fullName') return row.fullName;
    if (key === 'coffeeShopName') return row.coffeeShopName;
    if (key === 'role') return this.roleLabel(row.role);
    if (key === 'medicalStatus') return this.statusLabel(row.medicalStatus);
    if (key === 'employmentDate') return row.employmentDate?.getTime() ?? 0;
    if (key === 'adaptationEndDate') return row.adaptationEndDate?.getTime() ?? 0;
    if (key === 'trainingStartDate') return row.trainingStartDate?.getTime() ?? 0;
    if (key === 'attestationDate') return row.attestationDate?.getTime() ?? 0;
    if (key === 'medicalEndDate') return row.medicalEndDate?.getTime() ?? 0;
    if (key === 'dismissalDate') return row.dismissalDate ? row.dismissalDate.getTime() : 0;
    return '';
  }

  private mapRow(row: StaffTableApiRow): EmployeeRow {
    return {
      id: row.userId || row.id || `${Math.random()}`,
      fullName: row.fullName?.trim() || 'Без имени',
      coffeeShopName: row.coffeeShopName?.trim() || 'Без кофейни',
      role: this.mapRole(row.role, row.position),
      employmentDate: this.parseBackendDate(row.employmentDate),
      adaptationEndDate: this.parseBackendDate(row.adaptationCompletedAt),
      trainingStartDate: this.parseBackendDate(row.trainingCenterStartedAt),
      attestationDate: this.parseBackendDate(row.trainingCenterCompletedAt),
      medicalEndDate: this.parseBackendDate(row.medicalExamExpiresAt),
      dismissalDate: this.parseBackendDate(row.terminationDate),
      medicalStatus: this.mapMedicalStatus(row.medicalExamStatus?.status),
    };
  }

  private mapRole(role: string | null | undefined, position: string | null | undefined): PersonnelRole {
    const roleRaw = (role || '').toLowerCase();
    const positionRaw = (position || '').toLowerCase();

    if (positionRaw.includes('стаж')) return 'trainee';
    if (roleRaw === 'supervisor') return 'supervisor';
    if (roleRaw === 'manager') return 'manager';
    if (roleRaw === 'admin') return 'admin';
    return 'barista';
  }

  private mapMedicalStatus(status: string | null | undefined): MedicalStatus {
    if (status === 'Медосмотр пройден') return 'passed';
    if (status === 'Нужно пройти медосмотр') return 'pending';
    if (status === 'Нельзя допускать до работы') return 'blocked';
    return 'no_data';
  }

  private parseBackendDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    // Формат DD:MM:YYYY (как в API staff-table / medical-card)
    if (/^\d{1,2}:\d{1,2}:\d{4}$/.test(trimmed)) {
      const [dayRaw, monthRaw, yearRaw] = trimmed.split(':');
      const day = Number(dayRaw);
      const month = Number(monthRaw);
      const year = Number(yearRaw);
      if (day > 0 && month > 0 && year > 0) {
        return new Date(year, month - 1, day);
      }
    }

    // Формат DD.MM.YYYY (точки)
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
      const [dayRaw, monthRaw, yearRaw] = trimmed.split('.');
      const day = Number(dayRaw);
      const month = Number(monthRaw);
      const year = Number(yearRaw);
      if (day > 0 && month > 0 && year > 0) {
        return new Date(year, month - 1, day);
      }
    }

    // ISO или другой формат
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  onTableScroll(): void {
    const tableCardEl = this.tableCard?.nativeElement;
    const bottomEl = this.bottomScroller?.nativeElement;
    if (!tableCardEl || !bottomEl) {
      return;
    }
    if (Math.abs(bottomEl.scrollLeft - tableCardEl.scrollLeft) > 1) {
      bottomEl.scrollLeft = tableCardEl.scrollLeft;
    }
  }

  onBottomScroll(): void {
    const tableCardEl = this.tableCard?.nativeElement;
    const bottomEl = this.bottomScroller?.nativeElement;
    if (!tableCardEl || !bottomEl) {
      return;
    }
    if (Math.abs(tableCardEl.scrollLeft - bottomEl.scrollLeft) > 1) {
      tableCardEl.scrollLeft = bottomEl.scrollLeft;
    }
  }

  private updateHorizontalScrollState(): void {
    const tableCardEl = this.tableCard?.nativeElement;
    if (!tableCardEl) {
      this.tableHasHorizontalScroll = false;
      this.tableScrollWidth = 0;
      return;
    }

    this.tableScrollWidth = tableCardEl.scrollWidth;
    this.tableHasHorizontalScroll = tableCardEl.scrollWidth > tableCardEl.clientWidth + 1;

    const bottomEl = this.bottomScroller?.nativeElement;
    if (bottomEl) {
      bottomEl.scrollLeft = tableCardEl.scrollLeft;
    }
  }
}

type PersonnelSortKey =
  | 'fullName'
  | 'coffeeShopName'
  | 'role'
  | 'employmentDate'
  | 'adaptationEndDate'
  | 'trainingStartDate'
  | 'attestationDate'
  | 'medicalStatus'
  | 'medicalEndDate'
  | 'dismissalDate';
