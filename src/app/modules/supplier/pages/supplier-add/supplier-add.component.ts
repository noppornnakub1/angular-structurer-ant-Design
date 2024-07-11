import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import {Location} from '@angular/common';
import { items_province } from '../../../../shared/constants/data-province.constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { ActivatedRoute, Router } from '@angular/router';

interface DataLocation {
  id:number,
  provice: string;
  district: string;
  subdistrict: string;
  postal_code: string;
}

@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './supplier-add.component.html',
  styleUrl: './supplier-add.component.scss'
})


export class SupplierAddComponent {

  items_provinces: DataLocation[] = items_province;
  filteredItemsProvince: DataLocation[] = items_province;
  supplierForm!: FormGroup;
  supplierBankForm!: FormGroup;
  suppilerId: number | null = null;
  isViewMode: boolean = false;

  constructor(private _location: Location,private fb: FormBuilder
    ,private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute ) 
  {}

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
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
      supplier_id: ['1', Validators.required],
      supplier_num: ['', Validators.required],
      supplier_type: ['', Validators.required],
      site: ['', Validators.required],
    });
    this.supplierBankForm = this.fb.group({
      bankName: ['']
    });
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.suppilerId = +id;
        this.loadCustomerData(this.suppilerId);
      }
    });
    if (this.router.url.includes('/view/')) {
      this.isViewMode = true;
      this.supplierForm.disable(); // ทำให้ฟอร์มไม่สามารถแก้ไขได้
    }
  }

  loadCustomerData(id: number): void {
    this.supplierService.findSupplierById(id).subscribe((data: any) => {
      this.supplierForm.patchValue(data);
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
      this.supplierForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        provice: selectedItem.provice
      });
    }
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      if (this.suppilerId) {
        this.onUpdate();  // Call update function if customerId exists
      } else {
        this.supplierService.addData(this.supplierForm.value).subscribe({
          next: (response) => {
            console.log('Data added successfully', response);
            this.router.navigate(['/feature/customer']); 
          },
          error: (err) => {
            console.error('Error adding data', err);
          }
        });
      }
    } else {
      this.supplierForm.markAllAsTouched();
      console.log('Form is not valid');
    }
  }
  onUpdate(): void {
    if (this.supplierForm.valid && this.suppilerId) {
      this.supplierService.updateData(this.suppilerId, this.supplierForm.value).subscribe({
        next: (response) => {
          console.log('Data updated successfully', response);
          this.router.navigate(['/feature/supplier']); 
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
      console.log('Form is not valid');
    }
  }
  

  approveCustomer(): void {
    console.log('Customer approved');
    this.router.navigate(['/feature/customer']);
  }

  rejectCustomer(): void {
    console.log('Customer rejected');
    this.router.navigate(['/feature/customer']);
  }


  backClicked() {
    this._location.back();
  }
}
