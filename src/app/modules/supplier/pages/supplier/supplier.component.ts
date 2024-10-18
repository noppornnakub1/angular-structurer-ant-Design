import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ISupplier } from '../../interface/supplier.interface';
import { Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../../user-manager/interface/role.interface';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.scss'
})
export class SupplierComponent implements OnInit {

  currentUser!: IRole | null;
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;
  listOfData: ISupplier[] = [];
  filteredData: ISupplier[] = [];
  displayData: ISupplier[] = [];
  filters = { name: '', supplier_num: '', tax_Id: '', status: '' };
  pageIndex: number = 1;
  pageSize: number = 10;
  statusOptions: string[] = ['All', 'Draft', 'Cancel', 'Pending Approved By ACC', 'Pending Approved By FN', 'Approved By ACC', 'Approve By FN', 'Reject By ACC', 'Reject By FN', 'Pending Sync.'];
  selectedStatus: string = 'All';

  listOfColumn = [
    {
      title: 'No.',
      compare: null,
      priority: false
    },
    {
      title: 'Name',
      compare: (a: ISupplier, b: ISupplier) => a.name.localeCompare(b.name),
      priority: false
    },
    {
      title: 'Supplier Number',
      compare: (a: ISupplier, b: ISupplier) => (a.supplierNum || '').localeCompare(b.supplierNum || ''),
      priority: 3
    },
    {
      title: 'Tax',
      compare: (a: ISupplier, b: ISupplier) => a.tax_Id.localeCompare(b.tax_Id),
      priority: 2
    },
    {
      title: 'Status',
      compare: (a: ISupplier, b: ISupplier) => a.status.localeCompare(b.status),
      priority: 1
    },
    {
      title: 'Action',
      compare: null,
      priority: 1
    }
  ];

  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private supplierService: SupplierService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {

    this.checkRole();
    this.getData();

  }
  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isUser = user.action.includes('user');
      }
    });
  }

  getData(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (currentUser.role == 1) {
      this.supplierService.getData().subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else if (currentUser.role == 3) {
      this.supplierService.findDataByUserCompanyACC(currentUser.company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else if (currentUser.role == 4) {
      this.supplierService.findDataByUserCompanyFN(currentUser.company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else {
      this.supplierService.findDataByUserId(currentUser.userId).subscribe({
        next: (response: any) => {
          this.listOfData = response;

          this.changeStatusIfNeeded();
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
  }

  changeStatusIfNeeded(): void {
    this.listOfData = this.listOfData.map(item => {
      if (item.status === 'Approved By ACC' && (item.paymentMethod === 'Transfer' || item.paymentMethod === 'Transfer_Employee')) {
        return { ...item, status: 'Pending Approved By FN' };
      }
      else if (item.status === 'Approved By ACC' && item.paymentMethod !== 'Transfer' && item.paymentMethod !== 'Transfer_Employee') {
        return { ...item, status: 'Pending Sync.' };
      }
      if (item.status === 'Approved By FN') {
        return { ...item, status: 'Pending Sync.' };
      }
      return item;
    });
  }

  applyFilters(): void {
    const { name, supplier_num, tax_Id } = this.filters;

    // แปลงข้อมูลที่กรอกในฟิลด์เป็นตัวพิมพ์เล็กเพื่อให้ไม่สนใจการพิมพ์เล็กหรือพิมพ์ใหญ่
    const lowerCaseName = name ? name.toLowerCase() : '';
    const lowerCaseSupplierNum = supplier_num ? supplier_num.toLowerCase() : '';
    const lowerCaseTaxId = tax_Id ? tax_Id.toLowerCase() : '';

    this.filteredData = this.listOfData.filter(data => {
      // ตรวจสอบและแปลงข้อมูลที่ต้องการกรองให้เป็นตัวพิมพ์เล็กเช่นกัน
      const dataName = data.name ? data.name.toLowerCase() : '';
      const dataSupplierNum = data.supplierNum ? data.supplierNum.toLowerCase() : '';
      const dataTaxId = data.tax_Id ? data.tax_Id.toLowerCase() : '';

      return (
        dataName.includes(lowerCaseName) &&  // ตรวจสอบชื่อที่ค้นหาตรงกับข้อมูลหรือไม่
        (
          lowerCaseSupplierNum ? dataSupplierNum.startsWith(lowerCaseSupplierNum) : true // ตรวจสอบ supplierNum โดยใช้ startsWith
        ) &&
        dataTaxId.includes(lowerCaseTaxId) &&  // ตรวจสอบ taxId
        (this.selectedStatus === 'All' || data.status === this.selectedStatus) // ตรวจสอบสถานะ
      );
    });

    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อมีการกรองข้อมูลใหม่
    this.updateDisplayData();
}

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updateDisplayData();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.updateDisplayData();
  }

  updateDisplayData(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayData = this.filteredData.slice(startIndex, endIndex);
    this._cdr.markForCheck();
  }

  addData(): void {
    this._router.navigate(['/feature/supplier/add']);
  }

  editSupplier(id: number): void {
    this._router.navigate(['/feature/supplier/edit', id]);
  }
  viewSupplier(id: number): void {
    this._router.navigate(['/feature/supplier/view', id]);
  }

  sortData(event: any): void {
    const sortField = event.key as keyof ISupplier;
    const sortOrder = event.value;

    if (sortField && sortOrder) {
      this.displayData = this.filteredData.sort((a, b) => {
        const comparison = a[sortField] > b[sortField] ? 1 : -1;
        return sortOrder === 'ascend' ? comparison : -comparison;
      });
    } else {
      this.displayData = [...this.filteredData];
    }
    this.cdr.detectChanges();
  }
}