import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Checklist,
  ChecklistCreate,
  ChecklistPeriodicity,
  ChecklistSection,
  ChecklistService,
  ChecklistStatus,
  ChecklistUpdate,
} from '../../../services/checklist.service';
import { CoffeeShopService } from '../../../services/coffee-shop.service';

interface DepartmentOption {
  id: string;
  name: string;
}

interface DraftItem {
  id: string;
  text: string;
}

interface DraftSection {
  id: string;
  title: string;
  items: DraftItem[];
}

type EditorSubmitMode = 'default' | 'activate';

@Component({
  selector: 'app-checklists-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklists-forms.component.html',
  styleUrl: './checklists-forms.component.scss',
})
export class ChecklistsFormsComponent implements OnInit {
  private readonly checklistService = inject(ChecklistService);
  private readonly coffeeShopService = inject(CoffeeShopService);

  isLoading = false;
  isSaving = false;
  error: string | null = null;

  checklists: Checklist[] = [];
  departments: DepartmentOption[] = [];

  searchQuery = '';
  departmentSearchQuery = '';
  statusFilter: 'all' | ChecklistStatus = 'all';
  openActionsForId: string | null = null;

  currentPage = 1;
  readonly pageSize = 8;

  showEditor = false;
  editingChecklistId: string | null = null;
  editorName = '';
  editorPeriodicity: ChecklistPeriodicity = 'daily';
  editorSelectedDepartmentIds: string[] = [];
  editorSections: DraftSection[] = [];

  readonly periodicityOptions: { value: ChecklistPeriodicity; label: string }[] = [
    { value: 'hourly', label: 'Каждый час' },
    { value: 'daily', label: 'Каждый день' },
    { value: 'weekly', label: 'Каждую неделю' },
    { value: 'monthly', label: 'Каждый месяц' },
  ];

  readonly statusOptions: { value: ChecklistStatus; label: string }[] = [
    { value: 'draft', label: 'Черновик' },
    { value: 'active', label: 'Активный' },
    { value: 'paused', label: 'Приостановлен' },
    { value: 'archived', label: 'Архив' },
  ];

  ngOnInit(): void {
    this.loadDepartments();
    this.loadChecklists();
  }

  @HostListener('document:click')
  closeActionsByOuterClick(): void {
    this.openActionsForId = null;
  }

  get filteredChecklists(): Checklist[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.checklists.filter((row) => {
      if (this.statusFilter !== 'all' && row.status !== this.statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        row.name.toLowerCase().includes(query) ||
        row.departmentNames.some((name) => name.toLowerCase().includes(query))
      );
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredChecklists.length / this.pageSize));
  }

  get visiblePageNumbers(): number[] {
    const maxVisible = 5;
    const pages: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  get pagedChecklists(): Checklist[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredChecklists.slice(start, start + this.pageSize);
  }

  get selectedDepartmentNames(): string[] {
    return this.editorSelectedDepartmentIds
      .map((id) => this.departments.find((dep) => dep.id === id)?.name ?? '')
      .filter((name) => !!name);
  }

  get availableDepartments(): DepartmentOption[] {
    const query = this.departmentSearchQuery.trim().toLowerCase();
    const selected = new Set(this.editorSelectedDepartmentIds);

    return this.departments.filter((dep) => {
      if (selected.has(dep.id)) {
        return false;
      }
      return !query || dep.name.toLowerCase().includes(query);
    });
  }

  get isEditorValid(): boolean {
    return this.editorName.trim().length >= 3 && this.editorSelectedDepartmentIds.length > 0;
  }

  onStatusFilterChange(value: 'all' | ChecklistStatus): void {
    this.statusFilter = value;
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  openCreateEditor(): void {
    this.editingChecklistId = null;
    this.editorName = '';
    this.editorPeriodicity = 'daily';
    this.editorSelectedDepartmentIds = [];
    this.editorSections = [this.createEmptySection()];
    this.departmentSearchQuery = '';
    this.showEditor = true;
    this.error = null;
  }

  openEditEditor(row: Checklist): void {
    this.editingChecklistId = row._id;
    this.editorName = row.name;
    this.editorPeriodicity = row.periodicity;
    this.editorSelectedDepartmentIds = [...row.departmentIds];
    this.editorSections = row.sections.length
      ? row.sections.map((section) => ({
          id: section.id,
          title: section.title,
          items: section.items.map((item) => ({ id: item.id, text: item.text })),
        }))
      : [this.createEmptySection()];

    this.departmentSearchQuery = '';
    this.showEditor = true;
    this.error = null;
    this.openActionsForId = null;
  }

  closeEditor(): void {
    if (this.isSaving) {
      return;
    }
    this.showEditor = false;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  toggleActions(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openActionsForId = this.openActionsForId === id ? null : id;
  }

  addDepartment(id: string): void {
    if (!this.editorSelectedDepartmentIds.includes(id)) {
      this.editorSelectedDepartmentIds = [...this.editorSelectedDepartmentIds, id];
    }
  }

  removeDepartment(id: string): void {
    this.editorSelectedDepartmentIds = this.editorSelectedDepartmentIds.filter((item) => item !== id);
  }

  selectAllDepartments(): void {
    this.editorSelectedDepartmentIds = this.departments.map((dep) => dep.id);
  }

  clearSelectedDepartments(): void {
    this.editorSelectedDepartmentIds = [];
  }

  addSection(): void {
    this.editorSections = [...this.editorSections, this.createEmptySection()];
  }

  removeSection(sectionId: string): void {
    if (this.editorSections.length === 1) {
      return;
    }
    this.editorSections = this.editorSections.filter((section) => section.id !== sectionId);
  }

  addItem(sectionId: string): void {
    this.editorSections = this.editorSections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: [...section.items, { id: this.uid(), text: '' }],
          }
        : section
    );
  }

  removeItem(sectionId: string, itemId: string): void {
    this.editorSections = this.editorSections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          }
        : section
    );
  }

  saveEditor(mode: EditorSubmitMode = 'default'): void {
    if (!this.isEditorValid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.error = null;

    const sections = this.toChecklistSections(this.editorSections);
    const departmentNames = this.selectedDepartmentNames;

    if (this.editingChecklistId) {
      const payload: ChecklistUpdate = {
        name: this.editorName.trim(),
        periodicity: this.editorPeriodicity,
        departmentIds: this.editorSelectedDepartmentIds,
        departmentNames,
        sections,
      };

      const stream =
        mode === 'activate'
          ? this.checklistService.updateChecklist(this.editingChecklistId, payload)
          : this.checklistService.updateChecklist(this.editingChecklistId, payload);

      stream.subscribe({
        next: (row) => {
          const next = mode === 'activate' ? { ...row, status: 'active' as ChecklistStatus } : row;
          this.checklists = this.checklists.map((item) =>
            item._id === this.editingChecklistId ? next : item
          );
          if (mode === 'activate') {
            this.updateStatus(next._id, 'active');
          }
          this.finalizeEditorSave();
        },
        error: () => {
          this.error = 'Не удалось сохранить чек-лист.';
          this.isSaving = false;
        },
      });
      return;
    }

    const payload: ChecklistCreate = {
      name: this.editorName.trim(),
      periodicity: this.editorPeriodicity,
      departmentIds: this.editorSelectedDepartmentIds,
      departmentNames,
      sections,
    };

    this.checklistService.createChecklist(payload).subscribe({
      next: (row) => {
        this.checklists = [row, ...this.checklists];
        if (mode === 'activate') {
          this.updateStatus(row._id, 'active');
        }
        this.finalizeEditorSave();
      },
      error: () => {
        this.error = 'Не удалось создать чек-лист.';
        this.isSaving = false;
      },
    });
  }

  duplicateChecklist(row: Checklist): void {
    this.openActionsForId = null;
    this.checklistService.duplicateChecklist(row._id).subscribe({
      next: (duplicated) => {
        this.checklists = [duplicated, ...this.checklists];
        this.currentPage = 1;
      },
      error: () => {
        this.error = 'Не удалось дублировать чек-лист.';
      },
    });
  }

  deleteChecklist(row: Checklist): void {
    this.openActionsForId = null;
    if (!confirm(`Удалить "${row.name}"?`)) {
      return;
    }

    this.checklistService.deleteChecklist(row._id).subscribe({
      next: () => {
        this.checklists = this.checklists.filter((item) => item._id !== row._id);
        this.fixPageAfterMutation();
      },
      error: () => {
        this.error = 'Не удалось удалить чек-лист.';
      },
    });
  }

  updateStatus(id: string, status: ChecklistStatus): void {
    this.openActionsForId = null;
    this.checklistService.updateChecklistStatus(id, status).subscribe({
      next: (updated) => {
        this.checklists = this.checklists.map((row) => (row._id === id ? updated : row));
      },
      error: () => {
        this.error = 'Не удалось изменить статус.';
      },
    });
  }

  statusLabel(status: ChecklistStatus): string {
    return this.statusOptions.find((item) => item.value === status)?.label ?? status;
  }

  periodicityLabel(periodicity: ChecklistPeriodicity): string {
    return this.periodicityOptions.find((item) => item.value === periodicity)?.label ?? periodicity;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  private finalizeEditorSave(): void {
    this.isSaving = false;
    this.showEditor = false;
    this.currentPage = 1;
  }

  private loadChecklists(): void {
    this.isLoading = true;
    this.error = null;

    this.checklistService.getChecklists().subscribe({
      next: (rows) => {
        this.checklists = rows;
        this.fixPageAfterMutation();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Не удалось загрузить чек-листы.';
        this.isLoading = false;
      },
    });
  }

  private loadDepartments(): void {
    this.coffeeShopService.getCoffeeShops({ page: 1, limit: 200 }).subscribe({
      next: (response: any) => {
        if (response?.data?.coffeeShops && Array.isArray(response.data.coffeeShops)) {
          this.departments = response.data.coffeeShops.map((shop: any) => ({
            id: String(shop._id),
            name: String(shop.name),
          }));
          return;
        }

        if (response?.coffeeShops && Array.isArray(response.coffeeShops)) {
          this.departments = response.coffeeShops.map((shop: any) => ({
            id: String(shop._id),
            name: String(shop.name),
          }));
          return;
        }

        this.departments = this.fallbackDepartments();
      },
      error: () => {
        this.departments = this.fallbackDepartments();
      },
    });
  }

  private fallbackDepartments(): DepartmentOption[] {
    return [
      { id: 'dep-1', name: 'Simple Coffee Нова Парк' },
      { id: 'dep-2', name: 'Simple Coffee Огни-2' },
      { id: 'dep-3', name: 'Simple Coffee Мир.Труд.Май' },
      { id: 'dep-4', name: 'Simple Coffee Атриум' },
    ];
  }

  private toChecklistSections(sections: DraftSection[]): ChecklistSection[] {
    return sections
      .map((section) => ({
        id: section.id,
        title: section.title.trim() || 'Новый раздел',
        items: section.items
          .map((item) => ({
            id: item.id,
            text: item.text.trim(),
          }))
          .filter((item) => !!item.text),
      }))
      .filter((section) => !!section.title || section.items.length > 0);
  }

  private createEmptySection(): DraftSection {
    return {
      id: this.uid(),
      title: '',
      items: [
        { id: this.uid(), text: '' },
        { id: this.uid(), text: '' },
      ],
    };
  }

  private fixPageAfterMutation(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private uid(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
}
