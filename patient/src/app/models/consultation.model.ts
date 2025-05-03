export enum ConsultationStatus {
    SCHEDULED = "SCHEDULED",
    WAITING = "WAITING",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
  }
  
  export enum MessageService {
    SMS = "SMS",
    EMAIL = "EMAIL",
    WHATSAPP = "WHATSAPP",
    MANUALLY = "MANUALLY",
  }
  
  export interface Consultation {
    id: number
    scheduledDate?: Date
    createdAt?: Date
    startedAt?: Date
    closedAt?: Date
    createdBy?: number
    groupId?: number
    owner?: number
    messageService?: MessageService
    whatsappTemplateId?: number
    status: ConsultationStatus
    participants: Participant[]
    practitionerName?: string // Derived field for UI
    specialtyName?: string // Derived field for UI
    feedback?: Feedback // For tracking if feedback was submitted
  }
  
  export interface Participant {
    id: number
    consultationId: number
    userId: number
    isActive: boolean
    joinedAt?: Date
    user?: User
  }
  
  export interface User {
    id: number
    role: "Patient" | "Practitioner" | "Admin"
    firstName: string
    lastName: string
    password: string
    temporaryAccount: boolean
    phoneNumber: string
    country: string
    language: string
    sex: "male" | "female" | "other"
    status: "approved" | "not_approved"
  }
  
  export interface Feedback {
    id: number
    consultationId: number
    rating: number
    comments: string
    submittedAt: Date
  }
  
  export interface MedicalGroup {
    id: number
    name: string
    specialties: Specialty[]
  }
  
  export interface Specialty {
    id: number
    name: string
    groupId: number
  }
  
  export interface TimeSlot {
    id: number
    startTime: Date
    endTime: Date
    available: boolean
    practitionerId?: number
  }
  
  export interface PaymentInfo {
    id: number
    consultationId: number
    amount: number
    currency: string
    status: "pending" | "completed" | "failed"
    paymentMethod: string
    transactionId?: string
    timestamp: Date
  }
  