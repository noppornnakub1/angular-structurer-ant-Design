import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { CustomerSupplier, DataOld } from '../../../customer/interface/customer.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../../authentication/services/auth.service';
import { CustomerService } from '../../../customer/services/customer.service';
import { IRole } from '../../../user-manager/interface/role.interface';
import { SupplierService } from '../../../supplier/services/supplier.service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ViewDetailsComponent } from './view-details/view-details.component';
import { ModalDataService } from '../../services/modal-data.service';
import { ViewDetailOldComponent } from './view-detail-old/view-detail-old.component';

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
  pageIndexOld: number = 1;
  pageSizeOld: number = 10;
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
    paymentMethod: '',
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
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.taxId.localeCompare(b.taxId),
      priority: 2
    },
    {
      title: 'Payment Method',
      compare: (a: CustomerSupplier, b: CustomerSupplier) =>
        (a.paymentMethod ?? '').localeCompare(b.paymentMethod ?? ''),
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
    private modal: NzModalService,
    private modalDataService: ModalDataService,
  ) { }

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      if (!localStorage.getItem('checkLogin')) {
        localStorage.setItem('checkLogin', '1');
        window.location.reload();
      } else {
        localStorage.removeItem('checkLogin');
      }
    }
    this.checkRole();
    this.getData();
  }

  ngAfterViewInit(): void {
    this.checkRole(); 
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      if (user && user.action) {
      this.currentUser = user;
      console.log("151",this.currentUser);
      
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isApprovedFN = user.action.includes('approvedFN');
        this.isUser = user.action.includes('user');
        console.log("this.isAdmin",this.isAdmin);
        console.log("this.isApproved",this.isApproved);
        console.log("this.isUser",this.isUser);
        console.log("this.isApprovedFN",this.isApprovedFN);
    } else {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log("184",currentUser);
      this.authService.getRole(currentUser.role)
      this.authService.currenttRole.subscribe(user => {
        if (user && user.action) {
        this.currentUser = user;
        console.log("189",this.currentUser);
        
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
      // สามารถเพิ่มการจัดการกรณีที่ไม่มี user เช่น redirect ไปยังหน้า login หรือแสดงข้อความ
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
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else if (currentUser.role == 3) {
      const userId = currentUser.userId;
      const company = currentUser.company;
      this.customerService.FindDataHistoryByApprover(userId, company,'Pending Approved By ACC').subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else if (currentUser.role == 4) {
      const userId = currentUser.userId;
      const company = currentUser.company;
      this.customerService.FindDataHistoryByApproverFN(userId, company,'Approved By ACC').subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else {
      const userId = currentUser.userId;
      console.log(userId);
      
      const company = undefined;
      this.customerService.findDataHistoryByUserId(userId, company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          console.log(this.listOfData);
          
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
  }

  searchDataOld(): void {
    if (this.selectedTypeOld === 'Customer') {
      this.customerService.findDataOldCustomer(this.filtersOld.num, this.filtersOld.name, this.filtersOld.site).subscribe({
        next: (response: any) => {
          console.log(response);
          this.listOfDataOld = response
          this.filteredDataOld = this.listOfDataOld;
          this.displayDataOld = this.listOfDataOld;
          this.updateDisplayDataOld();
          this._cdr.markForCheck();
        },
        error: () => {
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
          this._cdr.markForCheck();
        },
        error: () => {
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

  applyFilters(): void {
    const { name, num, tax_Id, source } = this.filters;
    this.filteredData = this.listOfData.filter(data =>
      (data.name?.includes(name) ?? true) &&
      (data.num?.includes(num) ?? true) &&
      (data.taxId?.includes(tax_Id) ?? true) &&
      (this.selectedType === 'All' || data.source === this.selectedType)
    );
    this.pageIndex = 1;
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
    this.pageIndex = 1;
    this.updateDisplayData();
  }

  updateDisplayData(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayData = this.filteredData.slice(startIndex, endIndex);
    this._cdr.markForCheck();
  }

  sortData(event: any): void {
    const sortField = event.key as keyof CustomerSupplier;
    const sortOrder = event.value;

    if (sortField && sortOrder) {
      this.displayData = this.filteredData.sort((a, b) => {
        const aField = a[sortField] as string | number;
        const bField = b[sortField] as string | number;

        const comparison = aField > bField ? 1 : -1;
        return sortOrder === 'ascend' ? comparison : -comparison;
      });
    } else {
      this.displayData = [...this.filteredData];
    }
    this.cdr.detectChanges();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onPageIndexChangeOld(pageIndex: number): void {
    this.pageIndexOld = pageIndex;
    this.updateDisplayDataOld();
  }
  
  onPageSizeChangeOld(pageSize: number): void {
    this.pageSizeOld = pageSize;
    this.pageIndexOld = 1;
    this.updateDisplayDataOld();
  }  

  updateDisplayDataOld(): void {
    const startIndex = (this.pageIndexOld - 1) * this.pageSizeOld;
    const endIndex = startIndex + this.pageSizeOld;
    this.displayDataOld = this.filteredDataOld.slice(startIndex, endIndex);
    console.log(this.displayDataOld);
  
    this._cdr.markForCheck();
  }  

  showModal(data: any): void {
    console.log('Data sent to modal:', data);
    if (data) {
      this.selectedData = data;
      this.isVisible = true;
      console.log('Selected Data:', this.selectedData);
      console.log('Modal is visible:', this.isVisible);
    } else {
      console.error('Data is null or undefined');
    }
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  openModal(data: any): void {
    console.log(data);
    
    this.modalDataService.setData(data);
    this.modal.create({
      nzTitle: 'Customer/Supplier Details',
      nzContent: ViewDetailsComponent,
      nzFooter: null,
    });
  }

  openModalold(data: any): void {
    console.log(data);
    
    this.modalDataService.setData(data);
    this.modal.create({
      nzTitle: 'Customer/Supplier Details',
      nzContent: ViewDetailOldComponent,
      nzFooter: null,
    });
  }
}