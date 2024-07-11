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
  filters = { name: '', supplier_num: '', tax_Id: '', status: '' };
  
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
        this.filteredData = response;
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