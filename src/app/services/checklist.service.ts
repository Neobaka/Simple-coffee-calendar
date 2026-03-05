import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, delay, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export type ChecklistStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ChecklistPeriodicity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Checklist {
  _id: string;
  name: string;
  departmentIds: string[];
  departmentNames: string[];
  periodicity: ChecklistPeriodicity;
  status: ChecklistStatus;
  sections: ChecklistSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistCreate {
  name: string;
  departmentIds: string[];
  departmentNames: string[];
  periodicity: ChecklistPeriodicity;
  sections: ChecklistSection[];
}

export interface ChecklistUpdate {
  name?: string;
  departmentIds?: string[];
  departmentNames?: string[];
  periodicity?: ChecklistPeriodicity;
  status?: ChecklistStatus;
  sections?: ChecklistSection[];
}

interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  private readonly apiUrl = `${environment.apiUrl}/checklists`;
  private readonly storageKey = 'checklists_local_data';
  private memoryStore: Checklist[] = [];

  constructor(private readonly http: HttpClient) {}

  getChecklists(): Observable<Checklist[]> {
    return this.http.get<BackendResponse<unknown>>(this.apiUrl).pipe(
      map((response) => this.extractChecklistArray(response.data)),
      catchError(() => of(this.readLocalChecklists()).pipe(delay(120)))
    );
  }

  createChecklist(payload: ChecklistCreate): Observable<Checklist> {
    return this.http.post<BackendResponse<unknown>>(this.apiUrl, payload).pipe(
      map((response) => this.extractChecklistSingle(response.data)),
      catchError(() => {
        const created = this.localCreate(payload);
        return of(created).pipe(delay(120));
      })
    );
  }

  updateChecklist(id: string, payload: ChecklistUpdate): Observable<Checklist> {
    return this.http.put<BackendResponse<unknown>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((response) => this.extractChecklistSingle(response.data)),
      catchError(() => {
        const updated = this.localUpdate(id, payload);
        return of(updated).pipe(delay(120));
      })
    );
  }

  updateChecklistStatus(id: string, status: ChecklistStatus): Observable<Checklist> {
    return this.http
      .patch<BackendResponse<unknown>>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(
        map((response) => this.extractChecklistSingle(response.data)),
        catchError(() => {
          const updated = this.localUpdate(id, { status });
          return of(updated).pipe(delay(120));
        })
      );
  }

  deleteChecklist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        this.localDelete(id);
        return of(void 0).pipe(delay(80));
      })
    );
  }

  duplicateChecklist(id: string): Observable<Checklist> {
    return this.http.post<BackendResponse<unknown>>(`${this.apiUrl}/${id}/duplicate`, {}).pipe(
      map((response) => this.extractChecklistSingle(response.data)),
      catchError(() => {
        const duplicated = this.localDuplicate(id);
        return of(duplicated).pipe(delay(120));
      })
    );
  }

  private extractChecklistArray(data: unknown): Checklist[] {
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeChecklist(item));
    }
    if (this.isRecord(data) && Array.isArray(data['checklists'])) {
      return data['checklists'].map((item) => this.normalizeChecklist(item));
    }
    return this.readLocalChecklists();
  }

  private extractChecklistSingle(data: unknown): Checklist {
    if (this.isChecklistLike(data)) {
      return this.normalizeChecklist(data);
    }
    if (this.isRecord(data) && this.isChecklistLike(data['checklist'])) {
      return this.normalizeChecklist(data['checklist']);
    }
    throw new Error('Unexpected checklist payload');
  }

  private normalizeChecklist(value: unknown): Checklist {
    const row = this.isRecord(value) ? value : {};
    const now = new Date().toISOString();

    return {
      _id: this.asString(row['_id']) || this.asString(row['id']) || this.uid(),
      name: this.asString(row['name']) || 'Без названия',
      departmentIds: this.asStringArray(row['departmentIds']),
      departmentNames: this.asStringArray(row['departmentNames']),
      periodicity: this.asPeriodicity(row['periodicity']),
      status: this.asStatus(row['status']),
      sections: this.asSections(row['sections']),
      createdAt: this.asString(row['createdAt']) || now,
      updatedAt: this.asString(row['updatedAt']) || now,
    };
  }

  private asPeriodicity(value: unknown): ChecklistPeriodicity {
    return value === 'hourly' || value === 'daily' || value === 'weekly' || value === 'monthly'
      ? value
      : 'daily';
  }

  private asStatus(value: unknown): ChecklistStatus {
    return value === 'draft' || value === 'active' || value === 'paused' || value === 'archived'
      ? value
      : 'draft';
  }

  private asSections(value: unknown): ChecklistSection[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((rawSection) => {
      const section = this.isRecord(rawSection) ? rawSection : {};
      const itemsRaw = Array.isArray(section['items']) ? section['items'] : [];

      return {
        id: this.asString(section['id']) || this.uid(),
        title: this.asString(section['title']) || 'Новый раздел',
        items: itemsRaw.map((rawItem) => {
          const item = this.isRecord(rawItem) ? rawItem : {};
          return {
            id: this.asString(item['id']) || this.uid(),
            text: this.asString(item['text']) || '',
          };
        }),
      };
    });
  }

  private readLocalChecklists(): Checklist[] {
    if (!this.canUseStorage()) {
      if (this.memoryStore.length) {
        return this.memoryStore;
      }
      this.memoryStore = this.seedChecklists();
      return this.memoryStore;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => this.normalizeChecklist(item));
        }
      } catch {
        // Ignore parse errors and recreate seed data.
      }
    }

    const seed = this.seedChecklists();
    this.writeLocalChecklists(seed);
    return seed;
  }

  private writeLocalChecklists(rows: Checklist[]): void {
    if (!this.canUseStorage()) {
      this.memoryStore = rows;
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(rows));
  }

  private localCreate(payload: ChecklistCreate): Checklist {
    const rows = this.readLocalChecklists();
    const now = new Date().toISOString();

    const created: Checklist = {
      _id: this.uid(),
      name: payload.name.trim(),
      departmentIds: [...payload.departmentIds],
      departmentNames: [...payload.departmentNames],
      periodicity: payload.periodicity,
      status: 'draft',
      sections: payload.sections,
      createdAt: now,
      updatedAt: now,
    };

    this.writeLocalChecklists([created, ...rows]);
    return created;
  }

  private localUpdate(id: string, payload: ChecklistUpdate): Checklist {
    const rows = this.readLocalChecklists();
    const target = rows.find((row) => row._id === id);

    if (!target) {
      throw new Error('Checklist not found');
    }

    const updated: Checklist = {
      ...target,
      ...payload,
      sections: payload.sections ?? target.sections,
      updatedAt: new Date().toISOString(),
    };

    const nextRows = rows.map((row) => (row._id === id ? updated : row));
    this.writeLocalChecklists(nextRows);
    return updated;
  }

  private localDelete(id: string): void {
    const rows = this.readLocalChecklists();
    const nextRows = rows.filter((row) => row._id !== id);
    this.writeLocalChecklists(nextRows);
  }

  private localDuplicate(id: string): Checklist {
    const rows = this.readLocalChecklists();
    const original = rows.find((row) => row._id === id);

    if (!original) {
      throw new Error('Checklist not found');
    }

    const now = new Date().toISOString();
    const copy: Checklist = {
      ...original,
      _id: this.uid(),
      name: `${original.name} (копия)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      sections: original.sections.map((section) => ({
        ...section,
        id: this.uid(),
        items: section.items.map((item) => ({
          ...item,
          id: this.uid(),
        })),
      })),
    };

    this.writeLocalChecklists([copy, ...rows]);
    return copy;
  }

  private seedChecklists(): Checklist[] {
    const now = new Date().toISOString();
    return [
      {
        _id: this.uid(),
        name: 'Чек-лист. Холодильник - Отделение',
        departmentIds: ['dep-1', 'dep-2'],
        departmentNames: ['Simple Coffee Нова Парк', 'Simple Coffee Огни-2'],
        periodicity: 'daily',
        status: 'active',
        sections: [
          {
            id: this.uid(),
            title: 'Открытие смены',
            items: [
              { id: this.uid(), text: 'Проверить температуру холодильника' },
              { id: this.uid(), text: 'Проверить срок годности молока' },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: this.uid(),
        name: 'Сан день. Подсобка - Отделение',
        departmentIds: ['dep-3'],
        departmentNames: ['Simple Coffee Мир.Труд.Май'],
        periodicity: 'hourly',
        status: 'draft',
        sections: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: this.uid(),
        name: 'Сан день. Туалет для гостей - Отделение',
        departmentIds: ['dep-4'],
        departmentNames: ['Simple Coffee Атриум'],
        periodicity: 'monthly',
        status: 'paused',
        sections: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private uid(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  private isChecklistLike(value: unknown): value is Record<string, unknown> {
    return this.isRecord(value) && (typeof value['name'] === 'string' || typeof value['_id'] === 'string');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private canUseStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
