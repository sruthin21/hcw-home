// src/app/consultation/consultation-history/consultation-history.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConsultationService } from '../../services/consultation.service';
import { AuthService } from '../../services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-consultation-history',
  templateUrl: './consultation-history.component.html',
  styleUrls: ['./consultation-history.component.scss']
})
export class ConsultationHistoryComponent implements OnInit {
  displayedColumns: string[] = ['patientName', 'date', 'time', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false;
  totalConsultations = 0;
  
  filterForm = new FormGroup({
    search: new FormControl(''),
    startDate: new FormControl(null),
    endDate: new FormControl(null)
  });
  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setupSearchListener();
    this.loadConsultations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupSearchListener() {
    this.filterForm.get('search').valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loadConsultations();
      });
  }

  loadConsultations() {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'Practitioner') {
      this.isLoading = false;
      return;
    }
    
    const filters = {
      practitionerId: currentUser.id,
      page: this.paginator ? this.paginator.pageIndex + 1 : 1,
      limit: this.paginator ? this.paginator.pageSize : 10,
      search: this.filterForm.get('search').value,
      startDate: this.filterForm.get('startDate').value,
      endDate: this.filterForm.get('endDate').value
    };
    
    this.consultationService.getConsultationHistory(filters)
      .subscribe(
        (result) => {
          this.dataSource.data = result.consultations.map(consultation => {
            // Find the patient in the participants
            const patient = consultation.participants.find(p => p.user.role === 'Patient');
            const patientName = patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Unknown Patient';
            
            // Format date and time
            const scheduledDate = new Date(consultation.scheduledDate);
            const date = scheduledDate.toLocaleDateString();
            const time = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return {
              ...consultation,
              patientName,
              patientId: patient?.user.id,
              formattedDate: date,
              formattedTime: time
            };
          });
          
          this.totalConsultations = result.total;
          this.isLoading = false;
        },
        (error) => {
          console.error('Error loading consultation history:', error);
          this.isLoading = false;
        }
      );
  }

  onDateFilterChange() {
    this.loadConsultations();
  }

  clearFilters() {
    this.filterForm.reset();
    this.loadConsultations();
  }

  onPageChange(event) {
    this.loadConsultations();
  }
}