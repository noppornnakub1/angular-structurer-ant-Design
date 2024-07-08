import { Component } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { ICustomer } from '../../../customer/interface/customer.interface';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  listOfData: ICustomer[] = [
    {
      key: "1",
      name: "ทดสอบ ทดสอบ",
      customer_num: "AA005",
      tax: "1994558991234",
      status: "submit"
    },
    {
      key: "2",
      name: "ทดสอบ2 ทดสอบ2",
      customer_num: "AA006",
      tax: "1994558991234",
      status: "Draft"
    },
  ];
}
