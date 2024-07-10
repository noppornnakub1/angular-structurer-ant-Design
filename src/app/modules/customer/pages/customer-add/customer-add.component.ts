import { Component, OnInit } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import {Location} from '@angular/common';
import { items_province } from '../../../../shared/constants/data-province.constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';


interface DataLocation {
  id:number,
  provice: string;
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

  constructor(private _location: Location, private fb: FormBuilder
    ,private customerService: CustomerService,
    private router: Router 
  ) {
 
  }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      tax_Id: ['', Validators.required],
      address_sup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      provice: ['', Validators.required],
      postal: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      customer_id: ['1', Validators.required],
      customer_num: ['', Validators.required],
      customer_type: ['', Validators.required],
      site: ['', Validators.required],
    });
    this.customerBankForm = this.fb.group({
      bankName: ['']
    });
  }

  onSearch(value: string): void {
    this.filteredItemsProvince = this.items_provinces.filter(item => 
      item.subdistrict.includes(value) ||
      item.district.includes(value) ||
      item.provice.includes(value) ||
      item.postal_code.includes(value)
    );
  }

  onPostalCodeChange(value: any): void {
    console.log("value ", value);
    const selectedItem = this.items_provinces.find(item => item.postal_code === value);
    if (selectedItem) {
      this.customerForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        provice: selectedItem.provice
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.customerService.addData(this.customerForm.value).subscribe({
        next: (response) => {
          console.log('Data added successfully', response);
          this.router.navigate(['/feature/customer']); // Redirect to customer list after successful addition
        },
        error: (err) => {
          console.error('Error adding data', err);
        }
      });
    } else {
      console.log('Form is not valid');
    }
  }

  backClicked(): void {
    this._location.back();
  }
}
