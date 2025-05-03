import { Component, type OnInit } from "@angular/core"
import  { ActivatedRoute, Router } from "@angular/router"
import  { ConsultationService } from "../../services/consultation.service"
import { type Consultation, ConsultationStatus } from "../../models/consultation.model"
import { CommonModule } from "@angular/common"
import { IonicModule } from "@ionic/angular"

@Component({
  selector: "app-consultation-detail",
  templateUrl: "./consultation-detail.page.html",
  styleUrls: ["./consultation-detail.page.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ConsultationDetailPage implements OnInit {
  consultation?: Consultation
  isLoading = true
  ConsultationStatus = ConsultationStatus

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
  ) {}

  ngOnInit() {
    this.loadConsultation()
  }

  ionViewWillEnter() {
    this.loadConsultation()
  }

  loadConsultation() {
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.isLoading = true
      this.consultationService.getConsultationById(Number.parseInt(id, 10)).subscribe((consultation) => {
        this.consultation = consultation
        this.isLoading = false
      })
    }
  }

  joinConsultation() {
    if (this.consultation) {
      this.consultationService.joinConsultation(this.consultation.id).subscribe(() => {
        // In a real app, this would navigate to the consultation room
        // For now, we'll just reload the consultation data
        this.loadConsultation()
      })
    }
  }

  completeConsultation() {
    if (this.consultation) {
      this.consultationService.completeConsultation(this.consultation.id).subscribe(() => {
        this.loadConsultation()
      })
    }
  }

  leaveFeedback() {
    if (this.consultation) {
      this.router.navigate(["/tabs/feedback", this.consultation.id])
    }
  }

  getStatusColor(): string {
    if (!this.consultation) return "medium"

    switch (this.consultation.status) {
      case ConsultationStatus.SCHEDULED:
        return "primary"
      case ConsultationStatus.WAITING:
        return "warning"
      case ConsultationStatus.ACTIVE:
        return "success"
      case ConsultationStatus.COMPLETED:
        return "medium"
      case ConsultationStatus.CANCELLED:
        return "danger"
      default:
        return "medium"
    }
  }

  canJoin(): boolean {
    if (!this.consultation) return false

    return (
      this.consultation.status === ConsultationStatus.SCHEDULED ||
      this.consultation.status === ConsultationStatus.WAITING ||
      this.consultation.status === ConsultationStatus.ACTIVE
    )
  }

  canComplete(): boolean {
    if (!this.consultation) return false

    return this.consultation.status === ConsultationStatus.ACTIVE
  }

  canLeaveFeedback(): boolean {
    if (!this.consultation) return false

    return this.consultation.status === ConsultationStatus.COMPLETED && !this.consultation.feedback
  }
}

export default ConsultationDetailPage
