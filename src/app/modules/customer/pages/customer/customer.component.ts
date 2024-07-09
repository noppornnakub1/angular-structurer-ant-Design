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
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit {

  currentUser!: IRole | null;
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;

  listOfData: ICustomer[] = [];
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);
  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.getData();
  }

  checkRole(){
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isUser = user.action.includes('user');
      }
    });
  }

  getData() {
    this.customerService.getData().subscribe({
      next: (res: any) => {
        const data = res;
        this.listOfData = data;
   
        this._cdr.markForCheck();
      },
      error: (err) => {

      }
    })
  }


  addData(){
    this._router.navigate(['/feature/customer/add'])
  }
}