import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { CustomerSupplier, DataOld, ICustomer } from '../../../customer/interface/customer.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../../authentication/services/auth.service';
import { CustomerService } from '../../../customer/services/customer.service';
import { IRole } from '../../../user-manager/interface/role.interface';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { ISupplier } from '../../../supplier/interface/supplier.interface';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule,FormsModule,NzModalModule,NzInputModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  currentUser!: IRole | null;
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isApprovedFN = false;
  isUser: boolean = false;
  displayData: CustomerSupplier[] = [];
  listOfData: CustomerSupplier[] = [];
  filteredData: CustomerSupplier[] = [];;
  displayDataOld: DataOld[] = [];
  listOfDataOld: DataOld[] = [];
  filteredDataOld: DataOld[] = [];;
  filters = { name: '', num: '', tax_Id: '', source: '' };
  filtersOld = { name: '', num: '', tax_Id: '', source: '', site: '' };
  pageIndex: number = 1;
  pageSize: number = 10;
  sourceOptions: string[] = ['All', 'Customer', 'Supplier'];
  sourceOptionsOld: string[] = ['Customer', 'Supplier'];
  selectedTabIndex = 0;
  selectedType: string = 'All';
  selectedTypeOld: string = '';
  isVisible = true;
  selectedData: any = {
    id: null,
    name: '',
    num: '',
    tax_Id: '',
    address_Sup: '',
    district: '',
    subdistrict: '',
    province: '',
    postalCode: '',
    tel: '',
    email: '',
    type: '',
    site: '',
    payment_Method: '',
    source: ''
  };
  listOfColumnCustomer = [
    {
      title: 'No.',
      compare: null,
      priority: false
    },
    {
      title: 'Name',
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.name.localeCompare(b.name),
      priority: false
    },
    {
      title: 'Customer & Supplier / Number',
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.num.localeCompare(b.num),
      priority: 3
    },
    {
      title: 'Tax',
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.tax_Id.localeCompare(b.tax_Id),
      priority: 2
    },
    {
      title: 'Payment Method',
      compare: (a: CustomerSupplier, b: CustomerSupplier) =>
        (a.payment_Method ?? '').localeCompare(b.payment_Method ?? ''),
      priority: 2
    },
    {
      title: 'Type',
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.source.localeCompare(b.source),
      priority: 2
    },
    {
      title: 'Action',
      compare: null,
      priority: 1
    },

  ];

  listOfColumnOld = [
    {
      title: 'No.',
      compare: null,
      priority: false
    },
    {
      title: 'Name',
      compare: (a: DataOld, b: DataOld) => a.NAME.localeCompare(b.NAME),
      priority: false
    },
    {
      title: 'Customer & Supplier / Number',
      compare: (a: DataOld, b: DataOld) => a.NUM.localeCompare(b.NUM),
      priority: 3
    },
    {
      title: 'Tax',
      compare: (a: DataOld, b: DataOld) => a.TAX??''.localeCompare(b.TAX ?? ''),
      priority: 2
    },
    {
      title: 'Payment Method',
      compare: (a: DataOld, b: DataOld) => a.PAYMENT_MEDTHOD??''.localeCompare(b.PAYMENT_MEDTHOD ?? ''),
      priority: 2
    },
    {
      title: 'Action',
      compare: null,
      priority: 1
    },

  ];



  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.checkRole();
    this.getData();
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      console.log("151",this.currentUser);
      
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isApprovedFN = user.action.includes('approvedFN');
        this.isUser = user.action.includes('user');
        console.log("this.isAdmin",this.isAdmin);
        console.log("this.isApproved",this.isApproved);
        console.log("this.isUser",this.isUser);
        console.log("this.isApprovedFN",this.isApprovedFN);
      }
    });
  }

  getData(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log("169",currentUser);
    
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (currentUser.role == 1) {
      const userId = undefined;
      const company = undefined;
      this.customerService.findDataHistoryByUserId(userId, company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          console.log(this.listOfData);
          
          // this.changeStatusIfNeeded();
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
      const userId = currentUser.user_id;
      const company = currentUser.company;
      this.customerService.FindDataHistoryByApprover(userId, company,'Pending Approved By ACC').subscribe({
        next: (response: any) => {
          this.listOfData = response;
          // this.changeStatusIfNeeded();
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
      const userId = currentUser.user_id;
      const company = currentUser.company;
      this.customerService.FindDataHistoryByApproverFN(userId, company,'Approved By ACC').subscribe({
        next: (response: any) => {
          this.listOfData = response;
          // this.changeStatusIfNeeded();
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
      const userId = currentUser.user_id;
      const company = undefined;
      this.customerService.findDataHistoryByUserId(userId, company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          // this.changeStatusIfNeeded();
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

  searchDataOld(): void {
    if (this.selectedTypeOld === 'Customer') {
      this.customerService.findDataOldCustomer(this.filtersOld.num, this.filtersOld.name, this.filtersOld.site).subscribe({
        next: (response: any) => {
          // this.listOfDataOld = response.map((item: any) => {
          //   // ตรวจสอบว่า TAX เป็น object หรือไม่
          //   if (typeof item.TAX === 'object') {
          //     // แปลง TAX object เป็น string
          //     item.TAX = JSON.stringify(item.TAX);
          //   }
          //   return item;
          // });
          console.log(response);
          
          this.filteredDataOld = this.listOfDataOld;
          this.displayDataOld = this.listOfDataOld;

          this.updateDisplayDataOld();
          // this.changeStatusIfNeeded();
          // this.filteredData = response;
          this._cdr.markForCheck();
        },
        error: () => {
          // Handle error
        }
      });
    }
    else if (this.selectedTypeOld === 'Supplier') {
      this.customerService.findDataOldSupplier(this.filtersOld.num, this.filtersOld.name, this.filtersOld.tax_Id).subscribe({
        next: (response: any) => {
          this.listOfDataOld = response
          console.log(this.listOfDataOld);
          
          this.filteredDataOld = this.listOfDataOld;
          this.displayDataOld = this.listOfDataOld;
          this.updateDisplayDataOld();
          // this.changeStatusIfNeeded();
          // this.filteredData = response;
          this._cdr.markForCheck();
        },
        error: () => {
          // Handle error
        }
      });
    }
    else {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ถูกต้อง!',
        text: 'โปรดตรวจสอบให้แน่ใจว่าได้เลือก Type แล้ว',
        confirmButtonText: 'ปิด'
      });
      return;
    }

  }


  // changeStatusIfNeeded(): void {
  //   this.listOfData = this.listOfData.map(item => {
  //     if (item.status === 'Approved By ACC') {
  //       return { ...item, status: 'Pending Sync.' };
  //     }
  //     if (item.status === 'Approved By FN') {
  //       return { ...item, status: 'Pending Sync.' };
  //     }
  //     return item;
  //   });
  // }

  applyFilters(): void {
    const { name, num, tax_Id, source } = this.filters;
    this.filteredData = this.listOfData.filter(data =>
      (data.name?.includes(name) ?? true) &&
      (data.num?.includes(num) ?? true) &&
      (data.tax_Id?.includes(tax_Id) ?? true) &&
      (this.selectedType === 'All' || data.source === this.selectedType)
    );
    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อมีการกรองข้อมูลใหม่
    this.updateDisplayData();
  }

  onStatusChange(status: string): void {
    this.selectedType = status;
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
    this._cdr.markForCheck();
  }

  sortData(event: any): void {
    const sortField = event.key as keyof CustomerSupplier; // ใช้ keyof CustomerSupplier
    const sortOrder = event.value;

    if (sortField && sortOrder) {
      this.displayData = this.filteredData.sort((a, b) => {
        const aField = a[sortField] as string | number;
        const bField = b[sortField] as string | number;

        const comparison = aField > bField ? 1 : -1;
        return sortOrder === 'ascend' ? comparison : -comparison;
      });
    } else {
      this.displayData = [...this.filteredData]; // Reset to original data if no sorting is applied
    }
    this.cdr.detectChanges();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onPageIndexChangeOld(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updateDisplayData();
  }

  onPageSizeChangeOld(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อเปลี่ยนขนาดหน้า
    this.updateDisplayDataOld();
  }

  updateDisplayDataOld(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayDataOld = this.filteredDataOld.slice(startIndex, endIndex);
    console.log(this.displayDataOld);
    
    this._cdr.markForCheck();
  }

  showModal(data: any): void {
    console.log('Data sent to modal:', data);  // ตรวจสอบข้อมูลที่ถูกส่งมา
    if (data) {
      this.selectedData = data;
      this.isVisible = true;
      console.log('Selected Data:', this.selectedData);  // ตรวจสอบข้อมูลใน selectedData
      console.log('Modal is visible:', this.isVisible);
    } else {
      console.error('Data is null or undefined');
    }
  }

  handleCancel(): void {
    this.isVisible = false;
  }


}
