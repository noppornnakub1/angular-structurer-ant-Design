import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalDataService {
  private userId!: number;

  setUserId(id: number): void {
    this.userId = id;
  }

  getUserId(): number {
    return this.userId;
  }
}