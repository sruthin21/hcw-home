import { Injectable } from "@angular/core"
import {
  type Consultation,
  ConsultationStatus,
  type User,
  type Participant,
  type Feedback,
  type MedicalGroup,
  type Specialty,
  type TimeSlot,
  type PaymentInfo,
} from "../models/consultation.model"

@Injectable({
  providedIn: "root",
})
export class MockDataService {
  private currentUser: User = {
    id: 1,
    role: "Patient",
    firstName: "John",
    lastName: "Doe",
    password: "password",
    temporaryAccount: false,
    phoneNumber: "+1234567890",
    country: "USA",
    language: "English",
    sex: "male",
    status: "approved",
  }

  private consultations: Consultation[] = [
    {
      id: 1,
      scheduledDate: new Date(Date.now() + 86400000), // tomorrow
      createdAt: new Date(Date.now() - 172800000),
      status: ConsultationStatus.SCHEDULED,
      practitionerName: "Dr. Jane Smith",
      specialtyName: "General Medicine",
      participants: [
        {
          id: 1,
          consultationId: 1,
          userId: 1,
          isActive: false,
        },
        {
          id: 2,
          consultationId: 1,
          userId: 2,
          isActive: false,
        },
      ],
    },
    {
      id: 2,
      scheduledDate: new Date(Date.now() - 3600000), // 1 hour ago
      createdAt: new Date(Date.now() - 86400000),
      startedAt: new Date(Date.now() - 3600000),
      status: ConsultationStatus.ACTIVE,
      practitionerName: "Dr. Michael Johnson",
      specialtyName: "Cardiology",
      participants: [
        {
          id: 3,
          consultationId: 2,
          userId: 1,
          isActive: true,
          joinedAt: new Date(Date.now() - 3000000),
        },
        {
          id: 4,
          consultationId: 2,
          userId: 3,
          isActive: true,
          joinedAt: new Date(Date.now() - 3300000),
        },
      ],
    },
    {
      id: 3,
      scheduledDate: new Date(Date.now() - 604800000), // 1 week ago
      createdAt: new Date(Date.now() - 1209600000),
      startedAt: new Date(Date.now() - 604800000),
      closedAt: new Date(Date.now() - 601200000),
      status: ConsultationStatus.COMPLETED,
      practitionerName: "Dr. Sarah Williams",
      specialtyName: "Dermatology",
      participants: [
        {
          id: 5,
          consultationId: 3,
          userId: 1,
          isActive: false,
          joinedAt: new Date(Date.now() - 604800000),
        },
        {
          id: 6,
          consultationId: 3,
          userId: 4,
          isActive: false,
          joinedAt: new Date(Date.now() - 604800000),
        },
      ],
      feedback: {
        id: 1,
        consultationId: 3,
        rating: 5,
        comments: "Great consultation, very helpful!",
        submittedAt: new Date(Date.now() - 601000000),
      },
    },
    {
      id: 4,
      scheduledDate: new Date(Date.now() - 259200000), // 3 days ago
      createdAt: new Date(Date.now() - 345600000),
      status: ConsultationStatus.CANCELLED,
      practitionerName: "Dr. Robert Brown",
      specialtyName: "Orthopedics",
      participants: [
        {
          id: 7,
          consultationId: 4,
          userId: 1,
          isActive: false,
        },
        {
          id: 8,
          consultationId: 4,
          userId: 5,
          isActive: false,
        },
      ],
    },
  ]

  private medicalGroups: MedicalGroup[] = [
    {
      id: 1,
      name: "Primary Care",
      specialties: [
        { id: 1, name: "General Medicine", groupId: 1 },
        { id: 2, name: "Family Medicine", groupId: 1 },
        { id: 3, name: "Internal Medicine", groupId: 1 },
      ],
    },
    {
      id: 2,
      name: "Specialized Care",
      specialties: [
        { id: 4, name: "Cardiology", groupId: 2 },
        { id: 5, name: "Dermatology", groupId: 2 },
        { id: 6, name: "Orthopedics", groupId: 2 },
        { id: 7, name: "Neurology", groupId: 2 },
      ],
    },
    {
      id: 3,
      name: "Mental Health",
      specialties: [
        { id: 8, name: "Psychiatry", groupId: 3 },
        { id: 9, name: "Psychology", groupId: 3 },
      ],
    },
  ]

  private timeSlots: TimeSlot[] = [
    // Generate time slots for the next 7 days
    ...Array(7)
      .fill(0)
      .flatMap((_, dayIndex:number) => {
        return Array(8)
          .fill(0)
          .map((_, hourIndex) => {
            const date = new Date()
            date.setDate(date.getDate() + dayIndex + 1)
            date.setHours(9 + hourIndex, 0, 0, 0)

            const endTime = new Date(date)
            endTime.setHours(endTime.getHours() + 1)

            return {
              id: dayIndex * 8 + hourIndex + 1,
              startTime: new Date(date),
              endTime: new Date(endTime),
              available: Math.random() > 0.3, // 70% chance of being available
              practitionerId: Math.floor(Math.random() * 5) + 2,
            }
          })
      }),
  ]

  private payments: PaymentInfo[] = [
    {
      id: 1,
      consultationId: 1,
      amount: 50,
      currency: "USD",
      status: "completed",
      paymentMethod: "Credit Card",
      transactionId: "txn_123456",
      timestamp: new Date(Date.now() - 172700000),
    },
    {
      id: 2,
      consultationId: 2,
      amount: 75,
      currency: "USD",
      status: "completed",
      paymentMethod: "PayPal",
      transactionId: "txn_234567",
      timestamp: new Date(Date.now() - 86300000),
    },
    {
      id: 3,
      consultationId: 3,
      amount: 60,
      currency: "USD",
      status: "completed",
      paymentMethod: "Credit Card",
      transactionId: "txn_345678",
      timestamp: new Date(Date.now() - 1209500000),
    },
  ]

  constructor() {}

  getCurrentUser(): User {
    return this.currentUser
  }

  getConsultations(): Consultation[] {
    return this.consultations
  }

  getConsultationById(id: number): Consultation | undefined {
    return this.consultations.find((c) => c.id === id)
  }

  getUserConsultations(userId: number): Consultation[] {
    return this.consultations.filter((c) => c.participants.some((p) => p.userId === userId))
  }

  getMedicalGroups(): MedicalGroup[] {
    return this.medicalGroups
  }

  getSpecialties(): Specialty[] {
    return this.medicalGroups.flatMap((group: any) => group.specialties)
  }

  getSpecialtiesByGroup(groupId: number): Specialty[] {
    const group = this.medicalGroups.find((g) => g.id === groupId)
    return group ? group.specialties : []
  }

  getAvailableTimeSlots(specialtyId: number, startDate: Date, endDate: Date): TimeSlot[] {
    // Filter time slots within the date range
    return this.timeSlots.filter((slot) => slot.available && slot.startTime >= startDate && slot.startTime <= endDate)
  }

  createConsultation(consultation: Partial<Consultation>): Consultation {
    const newId = Math.max(...this.consultations.map((c) => c.id)) + 1

    const newConsultation: Consultation = {
      id: newId,
      createdAt: new Date(),
      status: ConsultationStatus.SCHEDULED,
      participants: [],
      ...consultation,
    }

    this.consultations.push(newConsultation)
    return newConsultation
  }

  updateConsultation(consultation: Consultation): Consultation {
    const index = this.consultations.findIndex((c) => c.id === consultation.id)
    if (index !== -1) {
      this.consultations[index] = consultation
    }
    return consultation
  }

  addParticipant(consultationId: number, userId: number): Participant {
    const consultation = this.getConsultationById(consultationId)
    if (!consultation) {
      throw new Error("Consultation not found")
    }

    const newParticipantId = Math.max(...consultation.participants.map((p) => p.id), 0) + 1

    const participant: Participant = {
      id: newParticipantId,
      consultationId,
      userId,
      isActive: false,
    }

    consultation.participants.push(participant)
    return participant
  }

  submitFeedback(consultationId: number, rating: number, comments: string): Feedback {
    const consultation = this.getConsultationById(consultationId)
    if (!consultation) {
      throw new Error("Consultation not found")
    }

    const feedback: Feedback = {
      id: Math.floor(Math.random() * 1000) + 1,
      consultationId,
      rating,
      comments,
      submittedAt: new Date(),
    }

    consultation.feedback = feedback
    return feedback
  }

  createPayment(consultationId: number, amount: number, paymentMethod: string): PaymentInfo {
    const payment: PaymentInfo = {
      id: Math.floor(Math.random() * 1000) + 1,
      consultationId,
      amount,
      currency: "USD",
      status: "completed",
      paymentMethod,
      transactionId: `txn_${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date(),
    }

    this.payments.push(payment)
    return payment
  }

  getPaymentForConsultation(consultationId: number): PaymentInfo | undefined {
    return this.payments.find((p) => p.consultationId === consultationId)
  }

  joinConsultation(consultationId: number, userId: number): void {
    const consultation = this.getConsultationById(consultationId)
    if (!consultation) {
      throw new Error("Consultation not found")
    }

    const participant = consultation.participants.find((p) => p.userId === userId)
    if (participant) {
      participant.isActive = true
      participant.joinedAt = new Date()
    }

    if (consultation.status === ConsultationStatus.SCHEDULED || consultation.status === ConsultationStatus.WAITING) {
      consultation.status = ConsultationStatus.ACTIVE
      consultation.startedAt = new Date()
    }
  }

  completeConsultation(consultationId: number): void {
    const consultation = this.getConsultationById(consultationId)
    if (!consultation) {
      throw new Error("Consultation not found")
    }

    consultation.status = ConsultationStatus.COMPLETED
    consultation.closedAt = new Date()

    consultation.participants.forEach((p) => {
      p.isActive = false
    })
  }
}
