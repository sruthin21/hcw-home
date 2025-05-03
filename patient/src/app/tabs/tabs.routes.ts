import type { Routes } from "@angular/router"
import { TabsPage } from "./tabs.page"

export const routes: Routes = [
  {
    path: "tabs",
    component: TabsPage,
    children: [
      {
        path: "tab1",
        loadComponent: () => import("../tab1/tab1.page").then((m) => m.Tab1Page),
      },
      {
        path: "tab2",
        loadComponent: () => import("../tab2/tab2.page").then((m) => m.Tab2Page),
      },
      {
        path: "tab3",
        loadComponent: () => import("../tab3/tab3.page").then((m) => m.Tab3Page),
      },
      {
        path: "consultation-detail/:id",
        loadComponent: () =>
          import("../pages/consultation-detail/consultation-detail.page").then((m) => m.ConsultationDetailPage),
      },
      {
        path: "feedback/:id",
        loadComponent: () => import("../pages/feedback/feedback.page").then((m) => m.FeedbackPage),
      },
      {
        path: "booking-confirmation/:id",
        loadComponent: () =>
          import("../pages/booking-confirmation/booking-confirmation.page").then((m) => m.BookingConfirmationPage),
      },
      {
        path: "",
        redirectTo: "/tabs/tab1",
        pathMatch: "full",
      },
    ],
  },
  {
    path: "",
    redirectTo: "/tabs/tab1",
    pathMatch: "full",
  },
]
