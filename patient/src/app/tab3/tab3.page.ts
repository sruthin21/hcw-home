import { Component } from "@angular/core"
import { IonicModule } from "@ionic/angular"
import { CommonModule } from "@angular/common"
import { User } from "../models/consultation.model"
import { MockDataService } from "../services/mock-data.service"

@Component({
  selector: "app-tab3",
  templateUrl: "tab3.page.html",
  styleUrls: ["tab3.page.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export  class Tab3Page {
  currentUser: User

  constructor(private mockDataService: MockDataService) {
    this.currentUser = this.mockDataService.getCurrentUser()
  }
}

export default Tab3Page;