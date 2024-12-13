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

  constructor(private supplierService: SupplierService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const today = new Date();
    this.exportDate = today.toISOString().split('T')[0]; 
    this.formattedDate = this.formatDate(today); 
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.username = currentUser.user.username

  }

  exportExcel() {
    if (!this.exportDate) {
      Swal.fire('Warning!', 'กรุณาเลือก Date ก่อน', 'warning');
      return;
    }

    const payload = {
      Username: this.username,
      Date: this.exportDate
    };

    this.supplierService.exportExcel(payload).subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ApprovedSuppliers_${payload.Username}_${payload.Date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading file:', err);
      },
    });
  }
  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // ฟังก์ชันเมื่อมีการเลือกวันที่
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.exportDate = input.value; 
      const [year, month, day] = input.value.split('-');
      this.formattedDate = `${day}/${month}/${year}`; 
      console.log('Updated Date:', this.exportDate, this.formattedDate);
    }
  }

  focusDatePicker(): void {
    const dateInput = document.getElementById('nativeDatePicker') as HTMLInputElement;
    if (dateInput) {
      dateInput.click(); 
    }
  }

}



