// src/app/services/consultation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  createConsultation(consultationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, consultationData);
  }

  updateConsultation(id: number, updateData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updateData);
  }

  cancelConsultation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getConsultationHistory(filters: {
    practitionerId: number;
    page?: number;
    limit?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }): Observable<any> {
    let params = new HttpParams()
      .set('practitionerId', filters.practitionerId.toString())
      .set('page', filters.page?.toString() || '1')
      .set('limit', filters.limit?.toString() || '10');
      
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString().split('T')[0]);
    }
    
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString().split('T')[0]);
    }
    
    return this.http.get(`${this.apiUrl}/history`, { params });
  }

  getConsultationDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
}