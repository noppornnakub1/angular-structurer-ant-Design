import { Component, OnInit } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import {Location} from '@angular/common';
import { items_province } from '../../../../shared/constants/data-province.constant';
import { FormBuilder, FormGroup } from '@angular/forms';


interface DataLocation {
  id:number,
  province: string;
  district: string;
  subdistrict: string;
  postal_code: string;
}

@Component({
  selector: 'app-customer-add',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './customer-add.component.html',
  styleUrl: './customer-add.component.scss'
})
export class CustomerAddComponent implements OnInit {
  items_provinces: DataLocation[] = items_province;
  filteredItemsProvince: DataLocation[] = items_province;
  customerForm!: FormGroup;
  customerBankForm!: FormGroup;

  constructor(private _location: Location, private fb: FormBuilder) {
 
  }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      Name: [''],
      taxId: [''],
      address: [''],
      district: [''],
      subdistrict: [''],
      province: [''],
      postalCode: [''],
      telephone: [''],
      email: [''],
      customerNumber: [''],
      customerType: [''],
      site: [''],
      bankName: ['']
    });
    this.customerBankForm = this.fb.group({
      bankName: ['']
    });
  }

  onSearch(value: string): void {
    this.filteredItemsProvince = this.items_provinces.filter(item => 
      item.subdistrict.includes(value) ||
      item.district.includes(value) ||
      item.province.includes(value) ||
      item.postal_code.includes(value)
    );
  }

  onPostalCodeChange(value: any): void {
    console.log("value ", value);
    const selectedItem = this.items_provinces.find(item => item.id === value);
    if (selectedItem) {
      this.customerForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province
      });
    }
  }

  backClicked(): void {
    this._location.back();
  }
}
