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
      key: '1',
      name: 'ทดสอบ',
      group: 'Test',
      status: 'submit',
      accApproveStatus: 'Approved',
      finApproveStatus: 'Approved',
      syncStatus: 'Success'
    },
    {
      key: '2',
      name: 'ทดสอบ2',
      group: 'Test2',
      status: 'Draft',
      accApproveStatus: 'Approved',
      finApproveStatus: 'Approved',
      syncStatus: 'Success'
    }
  ];
}
