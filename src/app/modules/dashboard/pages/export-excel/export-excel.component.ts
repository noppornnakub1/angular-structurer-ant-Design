import { ChangeDetectorRef, Component } from '@angular/core';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-export-excel',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule, FormsModule],
  templateUrl: './export-excel.component.html',
  styleUrl: './export-excel.component.scss'
})
export class ExportExcelComponent {
  username: string = '';
  exportDate: string = '';
  formattedDate: string = '';
  exportDateEnd: string = '';
  formattedDateEnd: string = '';
  maxDate: string = '';
  constructor(
    private supplierService: SupplierService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const today = new Date();
    this.maxDate = this.getToday();
    this.exportDate = today.toISOString().split('T')[0];
    this.formattedDate = this.formatDate(today);
    this.exportDateEnd = today.toISOString().split('T')[0];
    this.formattedDateEnd = this.formatDate(today);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.username = currentUser.user.username

  }

  exportExcel() {
    if (!this.exportDate || !this.exportDateEnd) {
      Swal.fire('Warning!', 'กรุณาเลือก Date ก่อน', 'warning');
      return;
    }

    const payload = {
      Username: this.username,
      StartDate: this.exportDate,
      EndDate: this.exportDateEnd
    };

    this.supplierService.exportExcel(payload).subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ApprovedSuppliers_${payload.Username}_${payload.StartDate}_${payload.EndDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading file:', err);
        if (this.exportDate > this.exportDateEnd) {
          let errorMessage = 'Start Date ไม่สามารถมากกว่า End Date ได้';
          Swal.fire('warning!', errorMessage, 'warning');
        }
        else {
          let errorMessage = 'End Date ไม่สามารถมากกว่าปัจจุบันได้';
          Swal.fire('warning!', errorMessage, 'warning');
        }

      },
    });
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`; // เปลี่ยนจาก `/` เป็น `-`
  }

  // ฟังก์ชันเมื่อมีการเลือกวันที่
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.exportDate = input.value; // วันที่รูปแบบ YYYY-MM-DD
      const [year, month, day] = input.value.split('-');
      const selectedDate = new Date(Number(year), Number(month) - 1, Number(day)); // สร้าง Date Object
      this.formattedDate = this.formatDate(selectedDate);
    }
  }

  focusDatePicker(): void {
    const dateInput = document.getElementById('nativeDatePicker') as HTMLInputElement;
    if (dateInput) {
      dateInput.click();
    }
  }

  onDateChangeEnd(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.exportDateEnd = input.value;
      
      const [year, month, day] = input.value.split('-');
      const selectedDate = new Date(Number(year), Number(month) - 1, Number(day)); 
      this.formattedDateEnd = this.formatDate(selectedDate);
    }
  }

  focusDatePickerEnd(): void {
    const dateInput = document.getElementById('nativeDatePickerEnd') as HTMLInputElement;
    if (dateInput) {
      dateInput.click();
    }
  }

  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

}



