import { Component } from '@angular/core';
import { ModalDataService } from '../../../services/modal-data.service';

@Component({
  selector: 'app-view-detail-old',
  standalone: true,
  imports: [],
  templateUrl: './view-detail-old.component.html',
  styleUrl: './view-detail-old.component.scss'
})
export class ViewDetailOldComponent {
  data: any;

  constructor(private modalDataService: ModalDataService) {
    this.data = this.modalDataService.getData();
    console.log(this.data);
    
  }
}
