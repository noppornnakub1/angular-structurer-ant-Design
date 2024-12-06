import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalDataService {
  private userId!: number;
  private isEditMode: boolean = false;

  setUserId(id: number): void {
    this.userId = id;
    this.isEditMode = true;
  }
  clearData(): void {
    this.userId = 0;
    this.isEditMode = false;
  }

  getUserId(): number {
    return this.userId;
  }

  getIsEditMode(): boolean {
    return this.isEditMode;
  }
}