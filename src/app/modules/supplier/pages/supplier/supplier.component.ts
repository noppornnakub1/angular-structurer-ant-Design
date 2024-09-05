import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ISupplier } from '../../interface/supplier.interface';
import { Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { IUser } from '../../../user-manager/interface/user.interface';
import { AuthMockupService } from '../../../../core/mockup-api/auth-mockup.service';
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
      compare: (a: ISupplier, b: ISupplier) => a.name.localeCompare(b.name),
      priority: false
    },
    {
      title: 'Customer Number',
      compare: (a: ISupplier, b: ISupplier) =>  a.supplier_num.localeCompare(b.supplier_num),
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

  constructor(private supplierService: SupplierService,private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {

    this.checkRole();
    this.getData();

  }
  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      console.log(user);

      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isUser = user.action.includes('user');
      }
    });
  }

  getData(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('map ข้อมูล user', currentUser);
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (currentUser.role == 1) {
      this.supplierService.getData().subscribe({
        next: (response: any) => {
          this.listOfData = response;
          console.log(this.listOfData);
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
      this.supplierService.findDataByUserCompanyACC(currentUser.company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          console.log(this.listOfData);
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
      this.supplierService.findDataByUserCompanyFN(currentUser.company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          console.log(this.listOfData);
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
      this.supplierService.findDataByUserId(currentUser.user_id).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          console.log(response);
          
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
      if (item.status === 'Approved By ACC' && (item.payment_method === 'Transfer' || item.payment_method === 'Transfer_Employee')) {
        return { ...item, status: 'Pending Approved By FN' };
      }
      else if(item.status === 'Approved By ACC' && item.payment_method !== 'Transfer' && item.payment_method !== 'Transfer_Employee'){
        return { ...item, status: 'Pending Sync.' };
      }
      if (item.status === 'Approved By FN') {
        return { ...item, status: 'Pending Sync.' };
      }
      return item;
    });
  }


  applyFilters(): void {
    const { name, supplier_num, tax_Id, status } = this.filters;
    this.filteredData = this.listOfData.filter(data =>
      (data.name?.includes(name) ?? true) &&
      (data.supplier_num?.includes(supplier_num) ?? true) &&
      (data.tax_Id?.includes(tax_Id) ?? true) &&
      // (data.status?.includes(status) ?? true)
      (this.selectedStatus === 'All' || data.status === this.selectedStatus)
    );
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
    console.log(pageIndex);

  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อเปลี่ยนขนาดหน้า
    this.updateDisplayData();
    console.log('pageSize', pageSize);
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

  editCustomer(id: number): void {
    this._router.navigate(['/feature/supplier/edit', id]);
  }
  viewCustomer(id: number): void {
    this._router.navigate(['/feature/supplier/view', id]);
  }

  sortData(event: any): void {
    console.log('Sort event:', event);
    const sortField = event.key as keyof ISupplier;
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
}