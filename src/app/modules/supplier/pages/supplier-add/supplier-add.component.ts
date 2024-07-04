import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import {Location} from '@angular/common';
@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './supplier-add.component.html',
  styleUrl: './supplier-add.component.scss'
})
export class SupplierAddComponent {
  constructor(private _location: Location) 
  {}


  backClicked() {
    this._location.back();
  }
}
