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
  imports: [SharedModule,NgZorroAntdModule],
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

  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);
  
  constructor(private supplierService: SupplierService) {}

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
    this.supplierService.getData().subscribe({
      next: (response: any) => {
        this.listOfData = response;
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


  applyFilters(): void {
    const { name, supplier_num, tax_Id, status } = this.filters;
    this.filteredData = this.listOfData.filter(data =>
      (data.name?.includes(name) ?? true) &&
      (data.supplier_num?.includes(supplier_num) ?? true) &&
      (data.tax_Id?.includes(tax_Id) ?? true) &&
      (data.status?.includes(status) ?? true)
    );
    this.pageIndex = 1; // รีเซ็ต pageIndex เมื่อมีการกรองข้อมูลใหม่
    this.updateDisplayData();
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
    console.log('pageSize',pageSize);
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
}