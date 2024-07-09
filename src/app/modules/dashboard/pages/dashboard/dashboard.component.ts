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
  
  ];
}
