import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ConsultationCardComponent } from '../components/consultation-card/consultation-card.component';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Consultation, ConsultationStatus } from '../models/consultation.model';
import { ConsultationService } from '../services/consultation.service';
import { MockDataService } from '../services/mock-data.service';


@Component({
  selector: "app-tab1",
  templateUrl: "tab1.page.html",
  styleUrls: ["tab1.page.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, ConsultationCardComponent, FormsModule, RouterLink],
})
export class Tab1Page implements OnInit {
  upcomingConsultations: Consultation[] = []
  pastConsultations: Consultation[] = []
  isLoading = true
  activeSegment = "upcoming"
  currentUser: any

  @ViewChild("consultations") consultationsElement!: ElementRef

  constructor(
    private consultationService: ConsultationService,
    private mockDataService: MockDataService,
    private router: Router,
  ) {
    this.currentUser = this.mockDataService.getCurrentUser()
  }

  ngOnInit() {
    this.loadConsultations()
  }

  ionViewWillEnter() {
    this.loadConsultations()
  }

  loadConsultations() {
    this.isLoading = true

    this.consultationService.getUpcomingConsultations().subscribe((consultations) => {
      this.upcomingConsultations = consultations
      this.isLoading = false
    })

    this.consultationService.getPastConsultations().subscribe((consultations) => {
      this.pastConsultations = consultations
    })
  }

  segmentChanged(event: any) {
    this.activeSegment = event.detail.value
  }

  doRefresh(event: any) {
    this.loadConsultations()
    setTimeout(() => {
      event.target.complete()
    }, 1000)
  }

  hasActiveConsultation(): boolean {
    return this.upcomingConsultations.some((c) => c.status === ConsultationStatus.ACTIVE)
  }

  joinLatestConsultation() {
    const activeConsultation = this.upcomingConsultations.find((c) => c.status === ConsultationStatus.ACTIVE)
    if (activeConsultation) {
      this.joinConsultation(activeConsultation.id)
    }
  }

  getNextAppointment(): Consultation | undefined {
    if (this.upcomingConsultations.length === 0) return undefined

    // Sort by date and return the soonest one
    return [...this.upcomingConsultations].sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Number.POSITIVE_INFINITY
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Number.POSITIVE_INFINITY
      return dateA - dateB
    })[0]
  }

  canJoinConsultation(consultation?: Consultation): boolean {
    if (!consultation) return false
    return (
      consultation.status === ConsultationStatus.SCHEDULED ||
      consultation.status === ConsultationStatus.WAITING ||
      consultation.status === ConsultationStatus.ACTIVE
    )
  }

  joinConsultation(id?: number) {
    if (!id) return

    this.consultationService.joinConsultation(id).subscribe(() => {
      this.router.navigate(["/tabs/consultation-detail", id])
    })
  }

  getDoctorImage(name?: string): string {
    if (!name) return ""

    // In a real app, you would fetch the actual image
    // For now, we'll return empty string to show initials
    return ""
  }

  getInitials(name?: string): string {
    if (!name) return "?"

    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
  }

  scrollToConsultations() {
    const element = document.getElementById("consultations")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
}

export default Tab1Page
