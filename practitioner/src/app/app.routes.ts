// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConsultationHistoryComponent } from './consultation/consultation-history/consultation-history.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  {
    path: 'consultation-history',
    component: ConsultationHistoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Practitioner'] }
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }