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

  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private customerService: CustomerService) { }

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
    console.log('map ข้อมูล user', currentUser);
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (currentUser.role == 1) {
      this.customerService.getData().subscribe({
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
      this.customerService.findDataByUserCompanyACC(currentUser.company).subscribe({
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
      this.customerService.findDataByUserCompanyFN(currentUser.company).subscribe({
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
      this.customerService.findDataByUserId(currentUser.user_id).subscribe({
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
    const { name, customer_num, tax_Id, status } = this.filters;
    this.filteredData = this.listOfData.filter(data =>
      (data.name?.includes(name) ?? true) &&
      (data.customer_num?.includes(customer_num) ?? true) &&
      (data.tax_Id?.includes(tax_Id) ?? true) &&
      (data.status?.includes(status) ?? true)
    );
    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อมีการกรองข้อมูลใหม่
    this.updateDisplayData();
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