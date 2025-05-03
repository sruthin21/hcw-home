import { Component, type OnInit } from "@angular/core"
import {  FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import  { ActivatedRoute, Router } from "@angular/router"
import  { ConsultationService } from "../../services/consultation.service"
import  { Consultation } from "../../models/consultation.model"
import { CommonModule } from "@angular/common"
import { IonicModule } from "@ionic/angular"

@Component({
  selector: "app-feedback",
  templateUrl: "./feedback.page.html",
  styleUrls: ["./feedback.page.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class FeedbackPage implements OnInit {
  consultation?: Consultation
  feedbackForm!: FormGroup
  isLoading = true
  isSubmitting = false
  selectedCategories: string[] = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private consultationService: ConsultationService,
  ) {}

  ngOnInit() {
    this.initForm()
    this.loadConsultation()
  }

  initForm() {
    this.feedbackForm = this.formBuilder.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ["", Validators.required],
    })
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

  submitFeedback() {
    if (this.feedbackForm.valid && this.consultation) {
      this.isSubmitting = true

      const { rating, comments } = this.feedbackForm.value
      let enhancedComments = comments

      // Add selected categories to comments
      if (this.selectedCategories.length > 0) {
        enhancedComments += `\n\nHighlighted aspects: ${this.selectedCategories.join(", ")}`
      }

      this.consultationService.submitFeedback(this.consultation.id, rating, enhancedComments).subscribe(() => {
        this.isSubmitting = false
        this.router.navigate(["/tabs/consultation-detail", this.consultation?.id])
      })
    }
  }

  setRating(rating: number) {
    this.feedbackForm.get("rating")?.setValue(rating)
  }

  toggleCategory(category: string) {
    const index = this.selectedCategories.indexOf(category)
    if (index === -1) {
      this.selectedCategories.push(category)
    } else {
      this.selectedCategories.splice(index, 1)
    }
  }

  getDoctorImage(): string {
    // In a real app, you would fetch the actual image
    // For now, we'll return empty string to show initials
    return ""
  }

  getInitials(): string {
    if (!this.consultation?.practitionerName) return "?"

    return this.consultation.practitionerName
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
  }
}

export default FeedbackPage
