import { Component, type OnInit } from "@angular/core"
import  { ActivatedRoute, Router } from "@angular/router"
import  { ConsultationService } from "../../services/consultation.service"
import  { Consultation } from "../../models/consultation.model"
import { CommonModule } from "@angular/common"
import { IonicModule } from "@ionic/angular"

@Component({
  selector: "app-booking-confirmation",
  templateUrl: "./booking-confirmation.page.html",
  styleUrls: ["./booking-confirmation.page.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class BookingConfirmationPage implements OnInit {
  consultation?: Consultation
  isLoading = true

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
  ) {}

  ngOnInit() {
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

  viewConsultation() {
    if (this.consultation) {
      this.router.navigate(["/tabs/consultation-detail", this.consultation.id])
    }
  }

  goToDashboard() {
    this.router.navigate(["/tabs/tab1"])
  }
}

export default BookingConfirmationPage
