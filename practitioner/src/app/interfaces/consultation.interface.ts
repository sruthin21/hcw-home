export enum ConsultationStatus {
    WAITING = 'waiting',
    OPEN = 'open',
    CLOSED = 'closed'
  }
  
  export interface Feedback {
    rating: number;
    comments?: string;
    submittedAt: Date;
  }
  
  export interface Consultation {
    id: string;
    doctorName: string;
    specialty: string;
    date: Date;
    status: ConsultationStatus;
    feedback?: Feedback;
    notes?: string;
  }