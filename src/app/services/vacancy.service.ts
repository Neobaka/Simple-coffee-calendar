import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type VacancyRole = 'barista' | 'manager';
export type VacancyState = 'open' | 'candidate_found' | 'filled' | 'cancelled' | 'deleted';

export interface CoffeeShopShort {
  id: string;
  _id: string;
  name?: string;
  address?: string;
}

export interface VacancyCandidate {
  id: string;
  _id: string;
  fullName: string;
  role?: 'barista' | 'manager' | 'supervisor' | 'admin' | null;
  position?: string | null;
  coffeeShop?: CoffeeShopShort | null;
}

export interface VacancyAssignment {
  id: string;
  user: VacancyCandidate;
  assignedAt: string;
  contact?: string | null;
  shiftId?: string | null;
  removedAt?: string | null;
  removedReason?: string | null;
}

export interface Vacancy {
  id: string;
  _id: string;
  coffeeShop: CoffeeShopShort;
  date: string;
  startTime: string;
  endTime: string;
  peopleNeeded: number;
  roleNeeded: VacancyRole;
  contact: string;
  state: VacancyState;
  status: string;
  cancellationReason?: string | null;
  assignments: VacancyAssignment[];
  activeAssignmentsCount?: number;
  remainingSlots?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface VacanciesListResponse {
  success: boolean;
  data: {
    vacancies: Vacancy[];
    pagination: Pagination;
  };
}

export interface VacancyResponse {
  success: boolean;
  data: {
    vacancy: Vacancy;
  };
}

export interface VacancyCandidatesResponse {
  success: boolean;
  data: {
    users: VacancyCandidate[];
  };
}

export interface CreateVacancyRequest {
  date: string;
  startTime: string;
  endTime: string;
  peopleNeeded: number;
  roleNeeded: VacancyRole;
  contact: string;
  coffeeShop?: string;
  coffeeShopId?: string;
}

export interface AssignVacancyCandidatesRequest {
  candidates: Array<{
    userId: string;
    contact: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class VacancyService {
  private apiUrl = `${environment.apiUrl}/vacancies`;

  constructor(private http: HttpClient) {}

  getVacancies(params?: {
    page?: number;
    limit?: number;
    coffeeShop?: string;
    dateFrom?: string;
    dateTo?: string;
    state?: VacancyState;
    roleNeeded?: VacancyRole;
    includeDeleted?: boolean;
  }): Observable<VacanciesListResponse> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.coffeeShop) {
      httpParams = httpParams.set('coffeeShop', params.coffeeShop);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }
    if (params?.state) {
      httpParams = httpParams.set('state', params.state);
    }
    if (params?.roleNeeded) {
      httpParams = httpParams.set('roleNeeded', params.roleNeeded);
    }
    if (params?.includeDeleted !== undefined) {
      httpParams = httpParams.set('includeDeleted', String(params.includeDeleted));
    }

    return this.http.get<VacanciesListResponse>(this.apiUrl, { params: httpParams });
  }

  createVacancy(payload: CreateVacancyRequest): Observable<VacancyResponse> {
    return this.http.post<VacancyResponse>(this.apiUrl, payload);
  }

  deleteVacancy(id: string, reason?: string): Observable<VacancyResponse> {
    const body = reason ? { reason } : {};
    return this.http.delete<VacancyResponse>(`${this.apiUrl}/${id}`, { body });
  }

  searchCandidates(params: {
    query: string;
    role: VacancyRole;
    limit?: number;
  }): Observable<VacancyCandidatesResponse> {
    let httpParams = new HttpParams()
      .set('query', params.query)
      .set('role', params.role);

    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<VacancyCandidatesResponse>(`${this.apiUrl}/candidates`, { params: httpParams });
  }

  assignCandidates(vacancyId: string, payload: AssignVacancyCandidatesRequest): Observable<VacancyResponse> {
    return this.http.post<VacancyResponse>(`${this.apiUrl}/${vacancyId}/assign`, payload);
  }

  removeAssignment(vacancyId: string, assignmentId: string): Observable<VacancyResponse> {
    return this.http.delete<VacancyResponse>(`${this.apiUrl}/${vacancyId}/assignments/${assignmentId}`);
  }
}
