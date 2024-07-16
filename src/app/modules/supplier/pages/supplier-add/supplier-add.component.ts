import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { CommonModule, Location } from '@angular/common';
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
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../../user-manager/interface/role.interface';

export interface DataLocation {
  post_id: number,
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule, HttpClientModule
    , CommonModule,
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
  currentUser!: IRole | null;
  listOfType: IsupplierType[] = [];
  filteredDataType: IsupplierType[] = [];
  items_provinces: DataLocation[] = [];
  filteredItemsProvince: DataLocation[] = [];
  supplierForm!: FormGroup;
  supplierBankForm!: FormGroup;
  suppilerId: number | null = null;
  isViewMode: boolean = false;
  isAdmin = false;
  isApproved = false;
  isUser = false;
  private _cdr = inject(ChangeDetectorRef);
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService)

  constructor(private _location: Location, private fb: FormBuilder
    , private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef) { }

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
      supplier_id: [''],
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
        this.loadSupplierData(this.suppilerId);
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
      const supplierTypeId = this.getSupplierTypeId(value);
      if (supplierTypeId) {
        this.loadSupplierType(supplierTypeId); // เรียกใช้ฟังก์ชันนี้เมื่อมีการเปลี่ยนแปลงค่า supplier_type
      }
    });

    this.checkRole();
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      console.log(this.currentUser);
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isUser = user.action.includes('user');
        console.log(`isAdmin: ${this.isAdmin}, isApproved: ${this.isApproved}, isUser: ${this.isUser}`); // Log ค่าเพื่อเช็ค
      }

    });
  }

  loadSupplierData(id: number): void {
    this.supplierService.findSupplierById(id).subscribe((data: any) => {
      console.log('dataload', data)
      const postalCodeCombination = data.postalCode + '-' + data.subdistrict;
      this.supplierForm.patchValue({
        ...data,
        postalCode: postalCodeCombination
      }
      );
    });
  }

  loadSupplierType(id: number): void {
    this.supplierService.findSupplierTypeById(id).subscribe((data: any) => {
      const SupplierNumPrefix = data.code_from;
      this.supplierService.getTopSupplierByType(data.code).subscribe(topSupplierData => {
        let newSupplierNum: string;
        console.log('before', topSupplierData.supplier_num);

        if (topSupplierData.supplier_num === '000') {
          // ถ้าไม่เจอข้อมูล ให้ใช้ค่า default
          newSupplierNum = SupplierNumPrefix + '000';
        } else {
          // ถ้าเจอข้อมูล ใช้ค่า supplier_num ที่ดึงมาแล้ว increment
          newSupplierNum = this.incrementSupplierNum(topSupplierData.supplier_num, SupplierNumPrefix);
        }

        this.supplierForm.patchValue({ supplier_num: newSupplierNum });
        console.log('after', newSupplierNum);
      });
    });
  }

  private incrementSupplierNum(supplier_num: string, codeFrom: string): string {
    // ลบเว้นวรรคใน codeFrom
    const cleanCodeFrom = codeFrom.trim();
    
    // แยกส่วนของตัวอักษรและตัวเลข
    const numPart = supplier_num.substring(cleanCodeFrom.length);
    const num = parseInt(numPart, 10) + 1;

    // เติม 0 นำหน้าถ้าจำเป็น
    const paddedNum = num.toString().padStart(numPart.length, '0');

    return cleanCodeFrom + paddedNum;
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
    // หา selected item โดยใช้ทั้ง postalCode และบางค่าเฉพาะ เช่น subdistrict
    const [postalCode, subdistrict] = value.split('-');
    const selectedItem = this.items_provinces.find(item => item.postalCode === postalCode && item.subdistrict === subdistrict);
    if (selectedItem) {
      console.log('Selected Item: ', selectedItem);
      this.supplierForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province
      });

      this.cdr.markForCheck();
    } else {
      console.log('Selected Item not found.');
    }
  }

  // ฟังก์ชันช่วยเพื่อหาค่า subdistrict ที่ตรงกัน
  isSubdistrictMatching(item: DataLocation): boolean {
    const currentSubdistrict = this.supplierForm.get('subdistrict')?.value;
    return item.subdistrict === currentSubdistrict;
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      const formValue = this.prepareFormData();
      const selectedPostItem = this.items_provinces.find(item => item.postalCode === formValue.postalCode && this.isSubdistrictMatching(item));
      if (selectedPostItem) {
        formValue.post_id = selectedPostItem.post_id;
      }
      if (this.suppilerId) {
        this.onUpdate(formValue);  // Call update function if customerId exists
      } else {
        this.supplierService.addData(formValue).subscribe({
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
  onUpdate(formValue: any): void {
    if (this.supplierForm.valid && this.suppilerId) {
      this.supplierService.updateData(this.suppilerId, formValue).subscribe({
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

  prepareFormData(): any {
    const formValue = { ...this.supplierForm.value };
    const selectedPostItem = this.items_provinces.find(item => {
      const postalCode = formValue.postalCode.split('-')[0];
      return item.postalCode === postalCode && this.isSubdistrictMatching(item);
    });

    if (selectedPostItem) {
      formValue.postalCode = selectedPostItem.postalCode; // ใช้ค่า postalCode ที่ถูกต้อง
      formValue.post_id = selectedPostItem.post_id; // เพิ่ม post_id เข้าไปใน formValue
    }
    return formValue;
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
