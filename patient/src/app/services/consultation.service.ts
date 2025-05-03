import { Injectable } from "@angular/core"
import { type Observable, of } from "rxjs"
import {
  type Consultation,
  ConsultationStatus,
  type Feedback,
  type MedicalGroup,
  type Specialty,
  type TimeSlot,
  type PaymentInfo,
} from "../models/consultation.model"
import { MockDataService } from "./mock-data.service"

@Injectable({
  providedIn: "root",
})
export class ConsultationService {
  constructor(private mockDataService: MockDataService) {}

  getCurrentUserConsultations(): Observable<Consultation[]> {
    const currentUser = this.mockDataService.getCurrentUser()
    return of(this.mockDataService.getUserConsultations(currentUser.id))
  }

  getConsultationById(id: number): Observable<Consultation | undefined> {
    return of(this.mockDataService.getConsultationById(id))
  }

  getMedicalGroups(): Observable<MedicalGroup[]> {
    return of(this.mockDataService.getMedicalGroups())
  }

  getSpecialtiesByGroup(groupId: number): Observable<Specialty[]> {
    return of(this.mockDataService.getSpecialtiesByGroup(groupId))
  }

  getAvailableTimeSlots(specialtyId: number, startDate: Date, endDate: Date): Observable<TimeSlot[]> {
    return of(this.mockDataService.getAvailableTimeSlots(specialtyId, startDate, endDate))
  }

  createConsultation(consultation: Partial<Consultation>): Observable<Consultation> {
    const currentUser = this.mockDataService.getCurrentUser()

    // Add current user as participant
    const newConsultation = this.mockDataService.createConsultation({
      ...consultation,
      createdBy: currentUser.id,
    })

    this.mockDataService.addParticipant(newConsultation.id, currentUser.id)

    return of(newConsultation)
  }

  submitFeedback(consultationId: number, rating: number, comments: string): Observable<Feedback> {
    return of(this.mockDataService.submitFeedback(consultationId, rating, comments))
  }

  processPayment(consultationId: number, amount: number, paymentMethod: string): Observable<PaymentInfo> {
    return of(this.mockDataService.createPayment(consultationId, amount, paymentMethod))
  }

  joinConsultation(consultationId: number): Observable<void> {
    const currentUser = this.mockDataService.getCurrentUser()
    this.mockDataService.joinConsultation(consultationId, currentUser.id)
    return of(undefined)
  }

  completeConsultation(consultationId: number): Observable<void> {
    this.mockDataService.completeConsultation(consultationId)
    return of(undefined)
  }

  getUpcomingConsultations(): Observable<Consultation[]> {
    const currentUser = this.mockDataService.getCurrentUser()
    const userConsultations = this.mockDataService.getUserConsultations(currentUser.id)

    const upcoming = userConsultations.filter(
      (c) =>
        c.status === ConsultationStatus.SCHEDULED ||
        c.status === ConsultationStatus.WAITING ||
        c.status === ConsultationStatus.ACTIVE,
    )

    return of(upcoming)
  }

  getPastConsultations(): Observable<Consultation[]> {
    const currentUser = this.mockDataService.getCurrentUser()
    const userConsultations = this.mockDataService.getUserConsultations(currentUser.id)

    const past = userConsultations.filter(
      (c) => c.status === ConsultationStatus.COMPLETED || c.status === ConsultationStatus.CANCELLED,
    )

    return of(past)
  }
}
