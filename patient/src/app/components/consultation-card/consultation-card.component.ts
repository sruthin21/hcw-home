import { Component, Input, type OnInit } from "@angular/core"
import  { Router } from "@angular/router"
import  { ConsultationService } from "../../services/consultation.service"
import { IonicModule } from "@ionic/angular"
import { CommonModule } from "@angular/common"
import { Consultation, ConsultationStatus } from "src/app/models/consultation.model"

@Component({
    selector: "app-consultation-card",
    templateUrl: "./consultation-card.component.html",
    styleUrls: ["./consultation-card.component.scss"],
    standalone: true,
    imports: [IonicModule, CommonModule],
  })
  export class ConsultationCardComponent implements OnInit {
    @Input() consultation!: Consultation
  
    ConsultationStatus = ConsultationStatus
  
    constructor(
      private router: Router,
      private consultationService: ConsultationService,
    ) {}
  
    ngOnInit() {}
  
    getStatusColor(): string {
      switch (this.consultation.status) {
        case ConsultationStatus.SCHEDULED:
          return "primary"
        case ConsultationStatus.WAITING:
          return "warning"
        case ConsultationStatus.ACTIVE:
          return "success"
        case ConsultationStatus.COMPLETED:
          return "tertiary"
        case ConsultationStatus.CANCELLED:
          return "danger"
        default:
          return "medium"
      }
    }
  
    getFormattedDate(): string {
      if (!this.consultation.scheduledDate) {
        return "Not scheduled"
      }
  
      const date = new Date(this.consultation.scheduledDate)
      return date.toLocaleString()
    }
  
    viewDetails() {
      this.router.navigate(["/tabs/consultation-detail", this.consultation.id])
    }
  
    joinConsultation() {
      this.consultationService.joinConsultation(this.consultation.id).subscribe(() => {
        // In a real app, this would navigate to the consultation room
        // For now, we'll just navigate to the detail page
        this.router.navigate(["/tabs/consultation-detail", this.consultation.id])
      })
    }
  
    canJoin(): boolean {
      return (
        this.consultation.status === ConsultationStatus.SCHEDULED ||
        this.consultation.status === ConsultationStatus.WAITING ||
        this.consultation.status === ConsultationStatus.ACTIVE
      )
    }
  
    leaveFeedback() {
      this.router.navigate(["/tabs/feedback", this.consultation.id])
    }
  
    canLeaveFeedback(): boolean {
      return this.consultation.status === ConsultationStatus.COMPLETED && !this.consultation.feedback
    }
  
    getDoctorImage(): string {
      // In a real app, you would fetch the actual image
      // For now, we'll return empty string to show initials
      return ""
    }
  
    getInitials(): string {
      if (!this.consultation.practitionerName) return "?"
  
      return this.consultation.practitionerName
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
    }
  }  
  