import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ICustomer } from '../../interface/customer.interface';
import { CustomerService } from '../../services/customer.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { Router } from '@angular/router';

import { AuthMockupService } from '../../../../core/mockup-api/auth-mockup.service';
import { IUser } from '../../../user-manager/interface/user.interface';
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../../user-manager/interface/role.interface';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit {
  currentUser!: IRole | null;
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;
  displayData: ICustomer[] = [];
  listOfData: ICustomer[] = [];
  filteredData: ICustomer[] = [];
  filters = { name: '', customer_num: '', tax_Id: '', status: '' };
  pageIndex: number = 1;
  pageSize: number = 10;
  statusOptions: string[] = ['All', 'Draft', 'Cancel','Pending Approved By ACC','Pending Approved By FN', 'Approved By ACC', 'Approve By FN','Reject By ACC','Reject By FN','Pending Sync.'];
  selectedStatus: string = 'All';



  listOfColumn = [
    {
      title: 'No.',
      compare: null,
      priority: false
    },
    {
      title: 'Name',
      compare: (a: ICustomer, b: ICustomer) => a.name.localeCompare(b.name),
      priority: false
    },
    {
      title: 'Customer Number',
      compare: (a: ICustomer, b: ICustomer) =>  a.customerNum.localeCompare(b.customerNum),
      priority: 3
    },
    {
      title: 'Site',
      compare: (a: ICustomer, b: ICustomer) => a.site.localeCompare(b.site),
      priority: 2
    },
    {
      title: 'Tax',
      compare: (a: ICustomer, b: ICustomer) => a.taxId.localeCompare(b.taxId),
      priority: 2
    },
    {
      title: 'Status',
      compare: (a: ICustomer, b: ICustomer) => a.status.localeCompare(b.status),
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

  constructor(private customerService: CustomerService,private cdr: ChangeDetectorRef) { }

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
      this.customerService.getData().subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          // this.filteredData = response;
          this._cdr.markForCheck();
        },
        error: () => {
          // Handle error
        }
      });
    }
    else if (currentUser.role == 3) {
      this.customerService.findDataByUserCompanyACC(currentUser.company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          // this.filteredData = response;
          this._cdr.markForCheck();
        },
        error: () => {
          // Handle error
        }
      });
    }
    else if (currentUser.role == 4) {
      this.customerService.findDataByUserCompanyFN(currentUser.company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          // this.filteredData = response;
          this._cdr.markForCheck();
        },
        error: () => {
          // Handle error
        }
      });
    }
    else {
      this.customerService.findDataByUserId(currentUser.userId).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.changeStatusIfNeeded();
          this.applyFilters();
          // this.filteredData = response;
          // this.total = response.length;
          this._cdr.markForCheck();
        },
        error: () => {
          // Handle error
        }
      });
    }
  }

  changeStatusIfNeeded(): void {
    this.listOfData = this.listOfData.map(item => {
      if (item.status === 'Approved By ACC') {
        return { ...item, status: 'Pending Sync.' };
      }
      if (item.status === 'Approved By FN') {
        return { ...item, status: 'Pending Sync.' };
      }
      return item;
    });
  }

  applyFilters(): void {
    const { name, customer_num, tax_Id } = this.filters;

    // ตรวจสอบให้แน่ใจว่าค่าการค้นหาไม่เป็น null หรือ undefined ก่อนการแปลงเป็นตัวพิมพ์เล็ก
    const lowerCaseName = name ? name.toLowerCase() : '';
    const lowerCaseCustomerNum = customer_num ? customer_num.toLowerCase() : '';
    const lowerCaseTaxId = tax_Id ? tax_Id.toLowerCase() : '';

    this.filteredData = this.listOfData.filter(data => {
      const dataName = data.name ? data.name.toLowerCase() : '';
      const dataCustomerNum = data.customerNum ? data.customerNum.toLowerCase() : '';
      const dataTaxId = data.taxId ? data.taxId.toLowerCase() : '';

      return (
        dataName.includes(lowerCaseName) &&
        dataCustomerNum.includes(lowerCaseCustomerNum) &&
        dataTaxId.includes(lowerCaseTaxId) &&
        (this.selectedStatus === 'All' || data.status === this.selectedStatus)
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
    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อเปลี่ยนขนาดหน้า
    this.updateDisplayData();
  }

  updateDisplayData(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayData = this.filteredData.slice(startIndex, endIndex);
    console.log(this.displayData);
    
    this._cdr.markForCheck();
  }

  sortData(event: any): void {
    const sortField = event.key as keyof ICustomer;
    const sortOrder = event.value;
  
    if (sortField && sortOrder) {
      this.displayData = this.filteredData.sort((a, b) => {
        const comparison = a[sortField] > b[sortField] ? 1 : -1;
        return sortOrder === 'ascend' ? comparison : -comparison;
      });
    } else {
      this.displayData = [...this.filteredData]; // Reset to original data if no sorting is applied
    }
    this.cdr.detectChanges();
  }


  addData(): void {
    this._router.navigate(['/feature/customer/add']);
  }

  editCustomer(id: number): void {
    this._router.navigate(['/feature/customer/edit', id]);
  }
  viewCustomer(id: number): void {
    this._router.navigate(['/feature/customer/view', id]);
  }

}