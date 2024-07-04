import { Component } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import {Location} from '@angular/common';
@Component({
  selector: 'app-customer-add',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './customer-add.component.html',
  styleUrl: './customer-add.component.scss'
})
export class CustomerAddComponent {
  constructor(private _location: Location) 
  {}


  backClicked() {
    this._location.back();
  }
}
