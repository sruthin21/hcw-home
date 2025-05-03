
import { CommonModule } from "@angular/common"
import { IonicModule } from "@ionic/angular"
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms"
import { Component, OnInit } from "@angular/core"
import { MedicalGroup, Specialty, TimeSlot } from "../models/consultation.model"
import { Router } from "@angular/router"
import { ConsultationService } from "../services/consultation.service"

interface CalendarDay {
  day: number
  date: Date
  otherMonth: boolean
  isToday: boolean
  selected: boolean
  hasSlots: boolean
  disabled: boolean
}

@Component({
  selector: "app-tab2",
  templateUrl: "tab2.page.html",
  styleUrls: ["tab2.page.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule],
})
export  class Tab2Page implements OnInit {
  bookingForm!: FormGroup
  currentStep = 1
  totalSteps = 4

  medicalGroups: MedicalGroup[] = []
  specialties: Specialty[] = []
  availableTimeSlots: TimeSlot[] = []

  selectedGroupId?: number
  selectedSpecialtyId?: number
  selectedTimeSlot?: TimeSlot

  // Calendar variables
  currentDate = new Date()
  currentMonth = ""
  currentYear = 0
  weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  calendarDays: CalendarDay[] = []
  selectedDate?: Date

  isLoading = false

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private consultationService: ConsultationService,
  ) {}

  ngOnInit() {
    this.initForm()
    this.loadMedicalGroups()
    this.initCalendar()
  }

  initForm() {
    this.bookingForm = this.formBuilder.group({
      // Step 1: Select medical group and specialty
      groupId: ["", Validators.required],
      specialtyId: ["", Validators.required],

      // Step 2: Patient information and symptoms
      symptoms: ["", Validators.required],
      additionalNotes: [""],

      // Step 3: Select time slot
      timeSlotId: ["", Validators.required],

      // Step 4: Payment information
      paymentMethod: ["creditCard", Validators.required],
      cardNumber: ["", [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: ["", [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ["", [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    })
  }

  initCalendar() {
    this.updateCalendarMonth(this.currentDate)
  }

  updateCalendarMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()

    this.currentMonth = date.toLocaleString("default", { month: "long" })
    this.currentYear = year

    // Get first day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get days from previous month to fill first week
    const daysFromPrevMonth = firstDay.getDay()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    // Get total days in current month
    const daysInMonth = lastDay.getDate()

    // Calculate total days to show (previous month days + current month days + next month days)
    const totalDays = 42 // 6 rows of 7 days

    this.calendarDays = []

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const date = new Date(year, month - 1, day)
      this.calendarDays.push({
        day,
        date,
        otherMonth: true,
        isToday: this.isToday(date),
        selected: this.isSelectedDate(date),
        hasSlots: false,
        disabled: true,
      })
    }

    // Add days from current month
    const today = new Date()
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const isPastDate = date < new Date(today.setHours(0, 0, 0, 0))

      this.calendarDays.push({
        day: i,
        date,
        otherMonth: false,
        isToday: this.isToday(date),
        selected: this.isSelectedDate(date),
        hasSlots: !isPastDate && Math.random() > 0.3, // Simulate available slots
        disabled: isPastDate,
      })
    }

    // Add days from next month
    const remainingDays = totalDays - this.calendarDays.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      this.calendarDays.push({
        day: i,
        date,
        otherMonth: true,
        isToday: this.isToday(date),
        selected: this.isSelectedDate(date),
        hasSlots: false,
        disabled: true,
      })
    }
  }

  isToday(date: Date): boolean {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  isSelectedDate(date: Date): boolean {
    if (!this.selectedDate) return false

    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    )
  }

  prevMonth() {
    const date = new Date(this.currentYear, this.currentDate.getMonth() - 1, 1)
    this.currentDate = date
    this.updateCalendarMonth(date)
  }

  nextMonth() {
    const date = new Date(this.currentYear, this.currentDate.getMonth() + 1, 1)
    this.currentDate = date
    this.updateCalendarMonth(date)
  }

  selectDate(day: CalendarDay) {
    if (day.disabled) return

    this.calendarDays.forEach((d) => (d.selected = false))
    day.selected = true
    this.selectedDate = day.date

    // Load time slots for this date
    this.loadTimeSlotsForDate(day.date)
  }

  loadTimeSlotsForDate(date: Date) {
    if (!this.selectedSpecialtyId) return

    const endDate = new Date(date)
    endDate.setHours(23, 59, 59)

    this.isLoading = true
    this.consultationService.getAvailableTimeSlots(this.selectedSpecialtyId, date, endDate).subscribe((slots) => {
      this.availableTimeSlots = slots
      this.isLoading = false
    })
  }

  loadMedicalGroups() {
    this.isLoading = true
    this.consultationService.getMedicalGroups().subscribe((groups) => {
      this.medicalGroups = groups
      this.isLoading = false
    })
  }

  onGroupChange(event: any) {
    const groupId = Number.parseInt(event.detail.value, 10)
    this.selectedGroupId = groupId
    this.selectedSpecialtyId = undefined
    this.bookingForm.get("specialtyId")?.setValue("")

    this.isLoading = true
    this.consultationService.getSpecialtiesByGroup(groupId).subscribe((specialties) => {
      this.specialties = specialties
      this.isLoading = false
    })
  }

  onSpecialtyChange(event: any) {
    this.selectedSpecialtyId = Number.parseInt(event.detail.value, 10)
  }

  onTimeSlotSelect(timeSlot: TimeSlot) {
    this.selectedTimeSlot = timeSlot
    this.bookingForm.get("timeSlotId")?.setValue(timeSlot.id)
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.bookingForm.get("groupId")?.valid && this.bookingForm.get("specialtyId")?.valid) {
        this.currentStep++
      }
    } else if (this.currentStep === 2) {
      if (this.bookingForm.get("symptoms")?.valid) {
        this.currentStep++
      }
    } else if (this.currentStep === 3) {
      if (this.bookingForm.get("timeSlotId")?.valid) {
        this.currentStep++
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--
    }
  }

  submitBooking() {
    if (this.bookingForm.valid && this.selectedTimeSlot) {
      this.isLoading = true

      // Create consultation
      const consultationData = {
        scheduledDate: this.selectedTimeSlot.startTime,
        specialtyName: this.specialties.find((s) => s.id === this.selectedSpecialtyId)?.name,
        // In a real app, we would include more data
      }

      this.consultationService.createConsultation(consultationData).subscribe((consultation) => {
        // Process payment
        this.consultationService
          .processPayment(
            consultation.id,
            55, // Updated price with tax
            this.bookingForm.get("paymentMethod")?.value,
          )
          .subscribe(() => {
            this.isLoading = false
            this.router.navigate(["/tabs/booking-confirmation", consultation.id])
          })
      })
    }
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return "Select Medical Specialty"
      case 2:
        return "Describe Your Symptoms"
      case 3:
        return "Choose Appointment Time"
      case 4:
        return "Payment Information"
      default:
        return "Book Consultation"
    }
  }

  isStepValid(): any {
    switch (this.currentStep) {
      case 1:
        return this.bookingForm.get("groupId")?.valid && this.bookingForm.get("specialtyId")?.valid
      case 2:
        return this.bookingForm.get("symptoms")?.valid
      case 3:
        return this.bookingForm.get("timeSlotId")?.valid
      case 4:
        return (
          this.bookingForm.get("paymentMethod")?.valid &&
          this.bookingForm.get("cardNumber")?.valid &&
          this.bookingForm.get("expiryDate")?.valid &&
          this.bookingForm.get("cvv")?.valid
        )
      default:
        return false
    }
  }
}

export default  Tab2Page;