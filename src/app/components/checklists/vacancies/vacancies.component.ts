import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { TuiCalendar } from '@taiga-ui/core/components/calendar';
import {
  Vacancy,
  VacancyCandidate,
  VacancyRole,
  VacancyService,
  VacancyState,
} from '../../../services/vacancy.service';
import { CoffeeShop, CoffeeShopService } from '../../../services/coffee-shop.service';
import { AuthService, User } from '../../../services/auth.service';

type VacancyTab = 'vacancies' | 'archive' | 'workload';

type UserCoffeeShop = {
  id?: string;
  _id?: string;
  name?: string;
  address?: string;
};

@Component({
  selector: 'app-vacancies',
  standalone: true,
  imports: [CommonModule, FormsModule, ...TuiDropdown, TuiIcon, TuiCalendar],
  templateUrl: './vacancies.component.html',
  styleUrls: ['./vacancies.component.scss'],
})
export class VacanciesComponent implements OnInit {
  private vacancyService = inject(VacancyService);
  private coffeeShopService = inject(CoffeeShopService);
  private authService = inject(AuthService);
  private currentUser: User | null = null;

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  vacancies: Vacancy[] = [];
  coffeeShops: CoffeeShop[] = [];

  activeTab: VacancyTab = 'vacancies';
  search = '';
  selectedRoles: VacancyRole[] = [];
  selectedStates: VacancyState[] = [];
  roleDropdownOpen = false;
  statusDropdownOpen = false;

  showCreateForm = false;
  calendarOpen = false;
  selectedDay: TuiDay | null = null;
  userCoffeeShopId = '';
  createModel: {
    roleNeeded: VacancyRole;
    coffeeShop: string;
    startTime: string;
    endTime: string;
    peopleNeeded: number;
    contact: string;
  } = {
    roleNeeded: 'barista',
    coffeeShop: '',
    startTime: '08:00',
    endTime: '16:00',
    peopleNeeded: 1,
    contact: '',
  };

  openedCandidatesVacancyId: string | null = null;
  candidateQueryByVacancy: Record<string, string> = {};
  candidatesByVacancy: Record<string, VacancyCandidate[]> = {};
  selectedCandidateByVacancy: Record<string, string> = {};
  candidatesLoadingByVacancy: Record<string, boolean> = {};
  candidateErrorByVacancy: Record<string, string> = {};

  readonly roleOptions: Array<{ value: VacancyRole; label: string }> = [
    { value: 'barista', label: 'Бариста' },
    { value: 'manager', label: 'Менеджер' },
  ];

  readonly stateOptions: Array<{ value: VacancyState; label: string }> = [
    { value: 'open', label: 'Открыта' },
    { value: 'candidate_found', label: 'Кандидат найден' },
    { value: 'filled', label: 'Назначен' },
    { value: 'cancelled', label: 'Отменена' },
    { value: 'deleted', label: 'Удалена' },
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.createModel.contact = this.currentUser?.email ?? '';
    this.userCoffeeShopId = this.resolveCoffeeShopId(this.currentUser);
    this.loadCoffeeShops();
    this.loadVacancies();
  }

  get filteredVacancies(): Vacancy[] {
    const normalizedSearch = this.search.trim().toLowerCase();

    return this.vacancies.filter((vacancy) => {
      if (this.activeTab === 'archive' && !this.isArchived(vacancy)) {
        return false;
      }

      if (this.activeTab === 'vacancies' && this.isArchived(vacancy)) {
        return false;
      }

      if (this.activeTab === 'workload' && vacancy.state !== 'filled') {
        return false;
      }

      if (this.selectedRoles.length > 0 && !this.selectedRoles.includes(vacancy.roleNeeded)) {
        return false;
      }

      if (this.selectedStates.length > 0 && !this.selectedStates.includes(vacancy.state)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        this.roleLabel(vacancy.roleNeeded),
        vacancy.coffeeShop?.name ?? '',
        vacancy.coffeeShop?.address ?? '',
        this.formatDate(vacancy.date),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }

  get createDateText(): string {
    return this.selectedDay ? this.formatTuiDay(this.selectedDay) : 'ДД.ММ.ГГ';
  }

  roleChipLabel(): string {
    return 'Должность';
  }

  statusChipLabel(): string {
    return 'Статус';
  }

  isRoleSelected(role: VacancyRole): boolean {
    return this.selectedRoles.includes(role);
  }

  isStateSelected(state: VacancyState): boolean {
    return this.selectedStates.includes(state);
  }

  toggleRole(role: VacancyRole): void {
    this.selectedRoles = this.selectedRoles.includes(role)
      ? this.selectedRoles.filter((value) => value !== role)
      : [...this.selectedRoles, role];
  }

  toggleState(state: VacancyState): void {
    this.selectedStates = this.selectedStates.includes(state)
      ? this.selectedStates.filter((value) => value !== state)
      : [...this.selectedStates, state];
  }

  selectAllRoles(): void {
    this.selectedRoles = this.roleOptions.map((option) => option.value);
  }

  clearRoles(): void {
    this.selectedRoles = [];
  }

  selectAllStates(): void {
    this.selectedStates = this.stateOptions.map((option) => option.value);
  }

  clearStates(): void {
    this.selectedStates = [];
  }

  loadVacancies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vacancyService
      .getVacancies({
        page: 1,
        limit: 100,
        includeDeleted: true,
      })
      .subscribe({
        next: (response) => {
          const vacancies = response?.data?.vacancies ?? [];
          this.vacancies = [...vacancies].sort((a, b) => {
            const first = new Date(`${a.date}T${a.startTime}`).getTime();
            const second = new Date(`${b.date}T${b.startTime}`).getTime();
            return first - second;
          });
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.errorMessage = this.extractError(error, 'Не удалось загрузить вакансии');
          this.isLoading = false;
        },
      });
  }

  loadCoffeeShops(): void {
    this.coffeeShopService.getCoffeeShops({ page: 1, limit: 200 }).subscribe({
      next: (response: any) => {
        const shops = response?.data?.coffeeShops ?? response?.coffeeShops ?? [];
        this.coffeeShops = Array.isArray(shops) ? shops : [];
        this.ensureCurrentUserCoffeeShopInOptions();

        if (!this.createModel.coffeeShop) {
          const hasUserShopInList = this.coffeeShops.some((shop) => shop._id === this.userCoffeeShopId);
          if (this.userCoffeeShopId && (hasUserShopInList || this.coffeeShops.length === 0)) {
            this.createModel.coffeeShop = this.userCoffeeShopId;
          } else if (this.coffeeShops.length === 1) {
            this.createModel.coffeeShop = this.coffeeShops[0]._id;
          }
        }
      },
      error: () => {
        // For manager/supervisor backend may restrict /coffee-shops list.
        // Keep at least current user's coffee shop in select.
        this.coffeeShops = [];
        this.ensureCurrentUserCoffeeShopInOptions();
      },
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetCreateForm();
    }
  }

  selectCreateDate(day: TuiDay): void {
    this.selectedDay = day;
    this.calendarOpen = false;
  }

  createVacancy(): void {
    if (!this.selectedDay) {
      this.errorMessage = 'Выберите дату вакансии';
      return;
    }

    if (!this.createModel.startTime || !this.createModel.endTime) {
      this.errorMessage = 'Укажите время начала и окончания';
      return;
    }

    if (this.createModel.startTime >= this.createModel.endTime) {
      this.errorMessage = 'Время окончания должно быть позже времени начала';
      return;
    }

    if (this.createModel.peopleNeeded < 1) {
      this.errorMessage = 'Количество человек должно быть не меньше 1';
      return;
    }

    const effectiveCoffeeShopId = this.createModel.coffeeShop || this.userCoffeeShopId;
    if (!effectiveCoffeeShopId) {
      this.errorMessage = 'Укажите кофейню в вакансии или добавьте кофейню в профиль пользователя';
      return;
    }

    // Backend in some environments validates coffee shop from user profile.
    // To avoid guaranteed 400, block creation when profile has no coffee shop.
    if (!this.userCoffeeShopId) {
      this.errorMessage =
        'User coffee shop is missing in profile. Assign coffee shop in profile and retry.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      date: new Date(`${this.selectedDay.toJSON()}T00:00:00`).toISOString(),
      startTime: this.createModel.startTime,
      endTime: this.createModel.endTime,
      peopleNeeded: this.createModel.peopleNeeded,
      roleNeeded: this.createModel.roleNeeded,
      contact: this.createModel.contact.trim(),
      coffeeShop: effectiveCoffeeShopId,
      coffeeShopId: effectiveCoffeeShopId,
    };

    this.vacancyService.createVacancy(payload).subscribe({
      next: (response) => {
        const vacancy = response?.data?.vacancy;
        if (vacancy) {
          this.vacancies = [...this.vacancies, vacancy];
        }
        this.isSubmitting = false;
        this.showCreateForm = false;
        this.resetCreateForm();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Не удалось создать вакансию');
        this.isSubmitting = false;
      },
    });
  }

  deleteVacancy(vacancy: Vacancy): void {
    const confirmed = confirm('Удалить вакансию?');
    if (!confirmed) {
      return;
    }

    this.vacancyService.deleteVacancy(vacancy._id).subscribe({
      next: () => {
        this.vacancies = this.vacancies.filter((item) => item._id !== vacancy._id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Не удалось удалить вакансию');
      },
    });
  }

  toggleCandidates(vacancy: Vacancy): void {
    if (this.openedCandidatesVacancyId === vacancy._id) {
      this.openedCandidatesVacancyId = null;
      return;
    }

    this.openedCandidatesVacancyId = vacancy._id;

    if (!this.candidateQueryByVacancy[vacancy._id]) {
      this.candidateQueryByVacancy[vacancy._id] = '';
    }
  }

  searchCandidates(vacancy: Vacancy): void {
    const query = (this.candidateQueryByVacancy[vacancy._id] ?? '').trim();

    if (query.length < 2) {
      this.candidateErrorByVacancy[vacancy._id] = 'Введите минимум 2 символа для поиска';
      this.candidatesByVacancy[vacancy._id] = [];
      return;
    }

    this.candidatesLoadingByVacancy[vacancy._id] = true;
    this.candidateErrorByVacancy[vacancy._id] = '';

    this.vacancyService
      .searchCandidates({
        query,
        role: vacancy.roleNeeded,
        limit: 15,
      })
      .subscribe({
        next: (response) => {
          const users = response?.data?.users ?? [];
          const activeAssignmentIds = new Set(
            vacancy.assignments.filter((item) => !item.removedAt).map((item) => item.user._id),
          );
          this.candidatesByVacancy[vacancy._id] = users.filter((candidate) => !activeAssignmentIds.has(candidate._id));
          this.candidatesLoadingByVacancy[vacancy._id] = false;
        },
        error: (error: unknown) => {
          this.candidateErrorByVacancy[vacancy._id] = this.extractError(
            error,
            'Не удалось загрузить кандидатов',
          );
          this.candidatesLoadingByVacancy[vacancy._id] = false;
        },
      });
  }

  assignSelectedCandidate(vacancy: Vacancy): void {
    const selectedUserId = this.selectedCandidateByVacancy[vacancy._id];

    if (!selectedUserId) {
      this.candidateErrorByVacancy[vacancy._id] = 'Выберите кандидата';
      return;
    }

    this.vacancyService
      .assignCandidates(vacancy._id, {
        candidates: [
          {
            userId: selectedUserId,
            contact: vacancy.contact || this.createModel.contact || '-',
          },
        ],
      })
      .subscribe({
        next: (response) => {
          const updatedVacancy = response?.data?.vacancy;
          if (updatedVacancy) {
            this.replaceVacancy(updatedVacancy);
          }
          this.candidatesByVacancy[vacancy._id] = [];
          this.selectedCandidateByVacancy[vacancy._id] = '';
          this.candidateQueryByVacancy[vacancy._id] = '';
          this.openedCandidatesVacancyId = null;
        },
        error: (error: unknown) => {
          this.candidateErrorByVacancy[vacancy._id] = this.extractError(
            error,
            'Не удалось назначить кандидата',
          );
        },
      });
  }

  removeAssignment(vacancy: Vacancy, assignmentId: string): void {
    const confirmed = confirm('Удалить назначение?');
    if (!confirmed) {
      return;
    }

    this.vacancyService.removeAssignment(vacancy._id, assignmentId).subscribe({
      next: (response) => {
        const updatedVacancy = response?.data?.vacancy;
        if (updatedVacancy) {
          this.replaceVacancy(updatedVacancy);
        }
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Не удалось удалить назначение');
      },
    });
  }

  activeAssignments(vacancy: Vacancy): Vacancy['assignments'] {
    return vacancy.assignments.filter((item) => !item.removedAt);
  }

  roleLabel(role: VacancyRole): string {
    return role === 'manager' ? 'Менеджер' : 'Бариста';
  }

  stateLabel(state: VacancyState): string {
    switch (state) {
      case 'open':
        return 'Отклики';
      case 'candidate_found':
        return 'Кандидат найден';
      case 'filled':
        return 'Назначен';
      case 'cancelled':
        return 'Отменена';
      case 'deleted':
        return 'Удалена';
      default:
        return 'Статус';
    }
  }

  stateClass(state: VacancyState): string {
    switch (state) {
      case 'filled':
        return 'state-filled';
      case 'candidate_found':
        return 'state-candidate';
      case 'cancelled':
        return 'state-cancelled';
      case 'deleted':
        return 'state-deleted';
      default:
        return 'state-open';
    }
  }

  formatDate(date: string): string {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
      return date;
    }
    return value.toLocaleDateString('ru-RU');
  }

  private isArchived(vacancy: Vacancy): boolean {
    return vacancy.state === 'cancelled' || vacancy.state === 'deleted';
  }

  private formatTuiDay(day: TuiDay): string {
    const date = new Date(`${day.toJSON()}T00:00:00`);
    return date.toLocaleDateString('ru-RU');
  }

  private resetCreateForm(): void {
    this.selectedDay = null;
    this.calendarOpen = false;
    this.createModel = {
      roleNeeded: 'barista',
      coffeeShop: this.userCoffeeShopId,
      startTime: '08:00',
      endTime: '16:00',
      peopleNeeded: 1,
      contact: this.authService.getCurrentUserValue()?.email ?? '',
    };
  }

  private replaceVacancy(updatedVacancy: Vacancy): void {
    this.vacancies = this.vacancies.map((item) => (item._id === updatedVacancy._id ? updatedVacancy : item));
  }

  private ensureCurrentUserCoffeeShopInOptions(): void {
    const fallback = this.currentUserCoffeeShopOption();
    if (!fallback) {
      return;
    }

    const exists = this.coffeeShops.some((shop) => shop._id === fallback._id);
    if (!exists) {
      this.coffeeShops = [fallback, ...this.coffeeShops];
    }

    if (!this.createModel.coffeeShop) {
      this.createModel.coffeeShop = fallback._id;
    }
  }

  private currentUserCoffeeShopOption(): CoffeeShop | null {
    if (!this.currentUser) {
      return null;
    }

    const raw = this.currentUser.coffeeShop;
    if (!raw) {
      return null;
    }

    if (typeof raw === 'string') {
      return {
        _id: raw,
        name: 'Моя кофейня',
        address: 'Из профиля',
        phone: '',
        openTime: '',
        closeTime: '',
        timezone: '',
        maxBaristasPerShift: 0,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      };
    }

    const obj = raw as UserCoffeeShop;
    const id = obj._id ?? obj.id;
    if (!id) {
      return null;
    }

    return {
      _id: id,
      name: obj.name ?? 'Моя кофейня',
      address: obj.address ?? 'Из профиля',
      phone: '',
      openTime: '',
      closeTime: '',
      timezone: '',
      maxBaristasPerShift: 0,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };
  }

  private resolveCoffeeShopId(user: User | null): string {
    const rawCoffeeShop = user?.coffeeShop;
    if (!rawCoffeeShop) {
      return '';
    }

    if (typeof rawCoffeeShop === 'string') {
      return rawCoffeeShop;
    }

    const objectCoffeeShop = rawCoffeeShop as UserCoffeeShop & {
      value?: string;
      coffeeShop?: string;
      data?: { _id?: string; id?: string };
    };

    return (
      objectCoffeeShop._id ??
      objectCoffeeShop.id ??
      objectCoffeeShop.value ??
      objectCoffeeShop.coffeeShop ??
      objectCoffeeShop.data?._id ??
      objectCoffeeShop.data?.id ??
      ''
    );
  }

  private extractError(error: unknown, fallback: string): string {
    const candidate = error as { error?: { message?: string }; message?: string };
    return candidate?.error?.message ?? candidate?.message ?? fallback;
  }
}

