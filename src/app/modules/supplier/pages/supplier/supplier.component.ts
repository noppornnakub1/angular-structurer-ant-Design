import { Component, inject, OnInit } from '@angular/core';
import { ISupplier } from '../../interface/supplier.interface';
import { Router } from '@angular/router';
import { SupplierService } from '../../services/customer.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { IUser } from '../../../user-manager/interface/user.interface';
import { AuthMockupService } from '../../../../core/mockup-api/auth-mockup.service';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.scss'
})
export class SupplierComponent implements OnInit {

  currentUser!: IUser | null;
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;
  listOfData: ISupplier[] = [];
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthMockupService);
  
  constructor(private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.supplierService.getData().subscribe(data => {
      this.listOfData = data;
    });
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // this.isAdmin = user.roles.includes('admin');
        // this.isApproved = user.roles.includes('approved');
        // this.isUser = user.roles.includes('user');
      }
    });
  }

  addData(){
    this._router.navigate(['/feature/supplier/add'])
  }
}