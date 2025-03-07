import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { CustomerSupplier, DataOld } from '../../../customer/interface/customer.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../../authentication/services/auth.service';
import { CustomerService } from '../../../customer/services/customer.service';
import { IRole } from '../../../user-manager/interface/role.interface';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ViewDetailsComponent } from './view-details/view-details.component';
import { ModalDataService } from '../../services/modal-data.service';
import { ViewDetailOldComponent } from './view-detail-old/view-detail-old.component';
import { PDPAConsent } from '../../services/PDPAConsent.interface';
import { MasterContentService } from '../../../../shared/constants/masterContent.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule, FormsModule, NzModalModule, NzInputModule],
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
  isLoading: boolean = false;
  showPDPA: boolean = false;
  doNotShowAgain: boolean = false;
  listOfDataPDPA: string = '';
  isScrolledToBottom = false;
  pdpaContent: string[] = [];
  showAnnouncement: boolean = false;
  doNotShowAgainAnnouncement: boolean = false;
  Announcement: string = '';
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
      compare: (a: CustomerSupplier, b: CustomerSupplier) => (a.num || '').localeCompare(b.num || ''),
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
      title: 'Site',
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.site.localeCompare(b.site),
      priority: 2
    },
    {
      title: 'Company',
      compare: (a: CustomerSupplier, b: CustomerSupplier) => a.company.localeCompare(b.company),
      priority: 2
    },
    {
      title: 'Group',
      compare: (a: CustomerSupplier, b: CustomerSupplier) =>
        (a.supplierGroup ?? '').localeCompare(b.supplierGroup ?? ''),
      priority: 2,
      role: ['isApprovedFN', 'isAdmin']
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
      compare: (a: DataOld, b: DataOld) => a.TAX ?? ''.localeCompare(b.TAX ?? ''),
      priority: 2,
      role: ['isApprovedFN', 'isAdmin', 'isApproved']
    },
    {
      title: 'Payment Method',
      compare: (a: DataOld, b: DataOld) => a.PAYMENT_METHOD ?? ''.localeCompare(b.PAYMENT_METHOD ?? ''),
      priority: 2
    },
    {
      title: 'Site',
      compare: (a: DataOld, b: DataOld) => a.SITE ?? ''.localeCompare(b.SITE ?? ''),
      priority: 2
    },
    {
      title: 'Company',
      compare: (a: DataOld, b: DataOld) => a.OU_SHORT_NAME ?? ''.localeCompare(b.OU_SHORT_NAME ?? ''),
      priority: 2
    },
    {
      title: 'Group',
      compare: (a: DataOld, b: DataOld) => a.COMPANY_GROUP ?? ''.localeCompare(b.COMPANY_GROUP ?? ''),
      priority: 2
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

  constructor(private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private modal: NzModalService,
    private modalDataService: ModalDataService,
    private masterService: MasterContentService,

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

    this.checkPDPA(currentUser.user.username);
    this.checkRole();
    this.getData();
    this.checkAnnouncement(currentUser.user.username)
  }

  ngAfterViewInit(): void {
    this.checkRole();
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      if (user && user.action) {
        this.currentUser = user;
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isApprovedFN = user.action.includes('approvedFN');
        this.isUser = user.action.includes('user');
        if (this.isApprovedFN && this.isAdmin == false) {
          this.isApproved = false;
        }
      } else {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.authService.getRole(currentUser.role)
        this.authService.currenttRole.subscribe(user => {
          if (user && user.action) {
            this.currentUser = user;
            this.isAdmin = user.action.includes('admin');
            this.isApproved = user.action.includes('approved');
            this.isApprovedFN = user.action.includes('approvedFN');
            this.isUser = user.action.includes('user');
            if (this.isApprovedFN && this.isAdmin == false) {
              this.isApproved = false;
            }
          }
        });
      }
    });
  }

  getData(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (currentUser.user.role == 1) {
      const userId = undefined;
      const company = undefined;
      this.customerService.findDataHistoryByUserId(userId, company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else if (currentUser.user.role == 3) {
      const userId = currentUser.user.userId;
      const company = currentUser.user.company;
      this.customerService.FindDataHistoryByApprover(userId, company, 'Pending Approved By ACC', 'ACC').subscribe({
        next: (response: any) => {
          this.listOfData = response;
          this.applyFilters();
          this._cdr.markForCheck();
        },
        error: () => {
        }
      });
    }
    else if (currentUser.user.role == 4) {
      const userId = currentUser.user.userId;
      const company = currentUser.user.company;
      this.customerService.FindDataHistoryByApproverFN(userId, company, 'Approved By ACC', 'FN').subscribe({
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
      const userId = currentUser.user.userId;
      const company = currentUser.user.company;
      this.customerService.findDataHistoryByUserId(userId, company).subscribe({
        next: (response: any) => {
          this.listOfData = response;
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
      this.isLoading = true;
      this.customerService.findDataOldCustomer(this.filtersOld.num, this.filtersOld.name, this.filtersOld.site).subscribe({
        next: (response: any) => {
          this.isLoading = false;
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
      this.isLoading = true;
      this.customerService.findDataOldSupplier(this.filtersOld.num, this.filtersOld.name, this.filtersOld.tax_Id).subscribe({
        next: (response: any) => {
          this.isLoading = false;
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
    const lowerCaseName = name ? name.toLowerCase() : '';
    const lowerCaseNum = num ? num.toLowerCase() : '';
    const lowerCaseTaxId = tax_Id ? tax_Id.toLowerCase() : '';

    this.filteredData = this.listOfData.filter(data => {
      const dataName = data.name ? data.name.toLowerCase() : '';
      const dataNum = data.num ? data.num.toLowerCase() : '';
      const dataTaxId = data.taxId ? data.taxId.toLowerCase() : '';

      return (
        dataName.includes(lowerCaseName) &&
        dataNum.includes(lowerCaseNum) &&
        dataTaxId.includes(lowerCaseTaxId) &&
        (this.selectedType === 'All' || data.source === this.selectedType)
      );
    });

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
    this._cdr.markForCheck();
  }

  showModal(data: any): void {
    if (data) {
      this.selectedData = data;
      this.isVisible = true;
    } else {
      console.error('Data is null or undefined');
    }
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  openModal(data: any): void {
    this.modalDataService.setData(data);
    this.modal.create({
      nzTitle: 'Customer/Supplier Details',
      nzContent: ViewDetailsComponent,
      nzFooter: null,
    });
  }

  openModalold(data: any): void {
    this.modalDataService.setData(data);
    this.modal.create({
      nzTitle: 'Customer/Supplier Details',
      nzContent: ViewDetailOldComponent,
      nzFooter: null,
    });
  }

  getVisibleColumns(): any[] {
    return this.listOfColumnCustomer.filter(column => {
      if (!column.role) {
        return true;
      }
      return column.role.some(role => (this as any)[role]);
    });
  }

  getVisibleColumnsOld(): any[] {
    return this.listOfColumnOld.filter(column => {
      if (!column.role) {
        return true;
      }
      return column.role.some(role => (this as any)[role]);
    });
  }

  acceptPDPA() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (this.doNotShowAgain) {
      const username = currentUser.user.username;
      this.customerService.addPDPAData(username).subscribe({
        next: (response: any) => {
        },
        error: () => {
        }
      });
    }
    else {
      sessionStorage.setItem('pdpaAccepted', 'true');
    }
    this.showPDPA = false;
  }

  acceptAnnouncement() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (this.doNotShowAgainAnnouncement) {
      const username = currentUser.user.username;
      this.masterService.addAnnouncement(username).subscribe({
        next: (response: any) => {
        },
        error: () => {
        }
      });
    }
    else {
      sessionStorage.setItem('Announcement', 'true');
    }
    this.showAnnouncement = false;
  }

  checkPDPA(username: string): void {
    const pdpaAccepted = sessionStorage.getItem('pdpaAccepted');

    if (pdpaAccepted) {
      this.showPDPA = false; 
      return;
    }
    this.customerService.findPDPAById(username).subscribe({
      next: (data) => {
        if (data && Object.keys(data).length > 0) {
          this.showPDPA = false;
        }
        else {
          this.showPDPA = true;
          this.loadPDPAContent();
        }
      },
      error: (err) => {
        console.error('Error fetching PDPA:', err);
        this.showPDPA = true;
      }
    });
  }
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    this.isScrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 1; // อนุญาตคลาดเคลื่อนเล็กน้อย
  }

  loadPDPAContent(): void {
    this.masterService.findContentById(1).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.listOfDataPDPA = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
        this.showPDPA = true      }
    });
  }

  loadAnnouncementContent(): void {
    this.masterService.findContentById(13).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.Announcement = data[0].content
          
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
        this.showAnnouncement = true      }
    });
  }

  checkAnnouncement(username: string): void {
    const Announcement = sessionStorage.getItem('Announcement');

    if (Announcement) {
      this.showAnnouncement = false; 
      return;
    }
    this.masterService.GetAnnouncementByUsername(username).subscribe({
      next: (data) => {
        if (data && Object.keys(data).length > 0) {
          this.showAnnouncement = false;
        }
        else {
          this.showAnnouncement = true;
          this.loadAnnouncementContent();
        }
      },
      error: (err) => {
        console.error('Error fetching PDPA:', err);
        this.showPDPA = true;
      }
    });
  }
}