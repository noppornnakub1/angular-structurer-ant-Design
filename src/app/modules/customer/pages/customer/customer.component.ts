import { Component, inject, OnInit } from '@angular/core';
import { ICustomer } from '../../interface/customer.interface';
import { CustomerService } from '../../services/customer.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { Router } from '@angular/router';

import { AuthMockupService } from '../../../../core/mockup-api/auth-mockup.service';
import { IUser } from '../../../user-manager/interface/user.interface';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnInit {

  currentUser!: IUser | null;
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;

  listOfData: ICustomer[] = [];
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthMockupService);

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.customerService.getData().subscribe(data => {
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
    this._router.navigate(['/feature/customer/add'])
  }
}