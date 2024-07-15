import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import {CommonModule, Location} from '@angular/common';
import { items_province } from '../../../../shared/constants/data-province.constant';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PostCodeService } from '../../../../shared/constants/post-code.service';
import { HttpClientModule } from '@angular/common/http';
import { IsupplierType } from '../../interface/supplierType.interface';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface DataLocation {
  post_id:number,
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule,HttpClientModule
    ,CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDividerModule,
    NzGridModule,
    NzIconModule
  ],
  providers: [PostCodeService],
  templateUrl: './supplier-add.component.html',
  styleUrl: './supplier-add.component.scss'
})


export class SupplierAddComponent {
  listOfType: IsupplierType[] = [];
  filteredDataType: IsupplierType[] = [];
  items_provinces: DataLocation[] = [];
  filteredItemsProvince: DataLocation[] = [];
  supplierForm!: FormGroup;
  supplierBankForm!: FormGroup;
  suppilerId: number | null = null;
  isViewMode: boolean = false;
  private _cdr = inject(ChangeDetectorRef);

  constructor(private _location: Location,private fb: FormBuilder
    ,private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef ) 
  {}

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      tax_Id: ['', Validators.required],
      address_sup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      supplier_id: ['1', Validators.required],
      supplier_num: ['', Validators.required],
      supplier_type: ['', Validators.required],
      site: ['00000', Validators.required],
      supplier_group: ['', Validators.required],
    });
    this.supplierBankForm = this.fb.group({
      supbank_id: ['1'],
      supplier_id:[''],
      bankName: [''],
      branch: [''],
      account_num: [''],
      vat: [''],
      account_name: ['']
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
    this.postCodeService.getPostCodes().subscribe(data => {
      console.log(data)
      this.items_provinces = data;
      this.filteredItemsProvince = data;
    });
    this.getSupplierType();

      // Subscribe to customer_type changes
      this.supplierForm.get('supplier_type')!.valueChanges.subscribe(value => {
        const customerTypeId = this.getSupplierTypeId(value);
        if (customerTypeId) {
          this.loadSupplierType(customerTypeId); // เรียกใช้ฟังก์ชันนี้เมื่อมีการเปลี่ยนแปลงค่า customer_type
        }
      });
  }

  loadCustomerData(id: number): void {
    this.supplierService.findSupplierById(id).subscribe((data: any) => {
      this.supplierForm.patchValue(data);
    });
  }

  loadSupplierType(id: number): void {
    this.supplierService.findSupplierTypeById(id).subscribe((data: any) => {
      const supplierNum = data.code_from
      this.supplierForm.patchValue({ supplier_num: supplierNum });
    });
  }

  getSupplierTypeId(code: string): number | undefined {
    const type = this.listOfType.find(t => t.code === code);
    return type ? type.id : undefined;
  }


  onSearch(value: string): void {
    this.filteredItemsProvince = this.items_provinces.filter(item =>
      item.subdistrict.includes(value) ||
      item.district.includes(value) ||
      item.province.includes(value) ||
      item.postalCode.includes(value)
    );
    console.log('Filtered Items: ', this.filteredItemsProvince);
  }

  onPostalCodeChange(value: any): void {
    console.log('Selected Postal Code: ', value);
    const selectedItem = this.items_provinces.find(item => item.post_id === value);
    if (selectedItem) {
      console.log('Selected Item: ', selectedItem);
      this.supplierForm.patchValue({
        postalCode: selectedItem.postalCode,
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province
      });
      this.cdr.markForCheck();
    } else {
      console.log('Selected Item not found.');
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

  getSupplierType(): void {
    this.supplierService.getSupplierType().subscribe({
      next: (response: any) => {
        console.log(response)
        this.listOfType = response;
        this.filteredDataType = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
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
