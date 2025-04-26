import { Injectable } from '@angular/core';
import { of, type Observable } from 'rxjs';
import type { Consultation } from '../../models/consultations/consultation.model';
import { ConsultationStatus } from '../../constants/consultation-status.enum';
import { formatConsultationTime } from '../../utils/date-utils';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultations`;

  private readonly mockConsultations: Consultation[] = [
    {
      id: '1',
      patientName: 'Olivier Bitsch',
      joinTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: ConsultationStatus.Active,
    },
    {
      id: '2',
      patientName: 'Olivier Bitsch',
      joinTime: new Date(),
      status: ConsultationStatus.Waiting,
    },
    {
      id: '3',
      patientName: 'Olivier Bitsch',
      joinTime: new Date(),
      status: ConsultationStatus.Waiting,
    },
    {
      id: '4',
      patientName: 'Olivier Bitsch',
      joinTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: ConsultationStatus.Completed,
    },
  ];

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

  getWaitingConsultations(): Observable<Consultation[]> {
    return of(
      this.mockConsultations.filter(
        (c) => c.status === ConsultationStatus.Waiting
      )
    );
  }

  getOpenConsultations(): Observable<Consultation[]> {
    return of(
      this.mockConsultations.filter(
        (c) => c.status === ConsultationStatus.Active
      )
    );
  }

  formatTime(date: Date): string {
    return formatConsultationTime(date);
  }
}
