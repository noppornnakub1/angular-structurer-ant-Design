import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalDataService {
  private modalData: any;

  setData(data: any) {
    this.modalData = data;
  }

  getData() {
    return this.modalData;
  }
}
