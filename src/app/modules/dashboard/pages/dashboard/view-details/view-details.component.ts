import { Component, Input } from '@angular/core';
import { ModalDataService } from '../../../services/modal-data.service';


@Component({
  selector: 'app-view-details',
  standalone: true,
  imports: [],
  templateUrl: './view-details.component.html',
  styleUrl: './view-details.component.scss'
})
export class ViewDetailsComponent {
  data: any;

  constructor(private modalDataService: ModalDataService) {
    this.data = this.modalDataService.getData();
  }
}
