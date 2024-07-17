import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { PostCodeService } from '../../../../shared/constants/post-code.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../../user-manager/interface/role.interface';
import { ICustomerType } from '../../interface/customerType.interface';
import { DataLocation } from '../../../supplier/pages/supplier-add/supplier-add.component';


@Component({
  selector: 'app-customer-add',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule, HttpClientModule],
  providers: [PostCodeService],
  templateUrl: './customer-add.component.html',
  styleUrl: './customer-add.component.scss'
})
export class CustomerAddComponent implements OnInit {
  listOfType: ICustomerType[] = [];
  filteredDataType: ICustomerType[] = [];
  currentUser!: IRole | null;
  items_provinces: DataLocation[] = [];
  filteredItemsProvince: DataLocation[] = [];
  customerForm!: FormGroup;
  customerBankForm!: FormGroup;
  customerId: number | null = null;
  isViewMode: boolean = false;
  isAdmin = false;
  isApproved = false;
  isUser = false;
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService)
  private _cdr = inject(ChangeDetectorRef);

  constructor(private _location: Location, private fb: FormBuilder
    , private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      id: [0],
      name: ['คุณ', Validators.required],
      tax_Id: ['', Validators.required],
      address_sup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      customer_id: ['1', Validators.required],
      customer_num: ['', Validators.required],
      customer_type: ['', Validators.required],
      site: ['00000', Validators.required],
    });
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.customerId = +id;
        this.loadCustomerData(this.customerId);
      }
    });
    if (this.router.url.includes('/view/')) {
      this.isViewMode = true;
      this.customerForm.disable(); // ทำให้ฟอร์มไม่สามารถแก้ไขได้
    }
    this.postCodeService.getPostCodes().subscribe(data => {
      console.log(data)
      this.items_provinces = data;
      this.filteredItemsProvince = data;
    });
    this.getCustomerType();

    // Subscribe to customer_type changes
    this.customerForm.get('customer_type')!.valueChanges.subscribe(value => {
      const customerTypeId = this.getCustomerTypeId(value);
      if (customerTypeId) {
        this.loadCustomerType(customerTypeId); // เรียกใช้ฟังก์ชันนี้เมื่อมีการเปลี่ยนแปลงค่า customer_type
      }
    });
    // this.customerForm.get('customer_type')!.valueChanges.subscribe(value => {
    //   const customerTypeId = this.getCustomerTypeId(value);
    //   if (customerTypeId) {
    //     this.loadCustomerType(customerTypeId); // เรียกใช้ฟังก์ชันนี้เมื่อมีการเปลี่ยนแปลงค่า customer_type
    //   }
    // });
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

  loadCustomerData(id: number): void {
    this.customerService.findCustomerById(id).subscribe((data: any) => {
      const postalCodeCombination = data.postalCode + '-' + data.subdistrict;
      this.customerForm.patchValue({
        ...data,
        postalCode: postalCodeCombination
      });

    });
  }

  loadCustomerType(id: number): void {
    this.customerService.findCustomerTypeById(id).subscribe((data: any) => {
        const customerNumPrefix = data.code_from;
        this.customerService.getTopCustomerByType(data.code).subscribe(topCustomerData => {
            let newCustomerNum: string;

            if (topCustomerData.customer_num === '000') {
                // ถ้าไม่เจอข้อมูล ให้ใช้ค่า default
                newCustomerNum = customerNumPrefix + '000';
            } else {
                // ถ้าเจอข้อมูล ใช้ค่า customer_num ที่ดึงมาแล้ว increment
                newCustomerNum = this.incrementCustomerNum(topCustomerData.customer_num, customerNumPrefix);
            }

            this.customerForm.patchValue({ customer_num: newCustomerNum });
        });
    });
}
  private incrementCustomerNum(customerNum: string, codeFrom: string): string {
    const numPart = customerNum.replace(codeFrom, '');
    const num = parseInt(numPart, 10) + 1;
    const paddedNum = num.toString().padStart(numPart.length, '0');
    return codeFrom + paddedNum;
  }

  getCustomerTypeId(code: string): number | undefined {
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
  }

  onPostalCodeChange(value: any): void {
    console.log('Selected Postal Code: ', value);
    // หา selected item โดยใช้ทั้ง postalCode และบางค่าเฉพาะ เช่น subdistrict
    const [postalCode, subdistrict] = value.split('-');
    const selectedItem = this.items_provinces.find(item => item.postalCode === postalCode && item.subdistrict === subdistrict);
    if (selectedItem) {
      this.customerForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province
      });
      this.cdr.markForCheck();
    }
  }

  isSubdistrictMatching(item: DataLocation): boolean {
    const currentSubdistrict = this.customerForm.get('subdistrict')?.value;
    return item.subdistrict === currentSubdistrict;
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      const formValue = this.prepareFormData();
      const selectedPostItem = this.items_provinces.find(item => item.postalCode === formValue.postalCode && this.isSubdistrictMatching(item));
      if (selectedPostItem) {
        formValue.post_id = selectedPostItem.post_id;
      }
      if (this.customerId) {
        this.onUpdate(formValue);  // Call update function if customerId exists
      } else {
        this.customerService.addData(this.customerForm.value).subscribe({
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
      this.customerForm.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  onUpdate(formValue: any): void {
    if (this.customerForm.valid && this.customerId) {
      this.customerService.updateData(this.customerId, formValue).subscribe({
        next: (response) => {
          console.log('Data updated successfully', response);
          this.router.navigate(['/feature/customer']);
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
    } else {
      this.customerForm.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  prepareFormData(): any {
    const formValue = { ...this.customerForm.value };
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

  getCustomerType(): void {
    this.customerService.getCustomerType().subscribe({
      next: (response: any) => {
        this.listOfType = response;
        this.filteredDataType = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }
  // คอมเม้นไว้ก่อนยังไม่ได้ทำ API
  // approveCustomer(): void {
  //   if (this.customerId !== null) {
  //     this.customerService.approveCustomer(this.customerId).subscribe({
  //       next: (response) => {
  //         console.log('Customer approved successfully', response);
  //         this.router.navigate(['/feature/customer']);
  //       },
  //       error: (err) => {
  //         console.error('Error approving customer', err);
  //       }
  //     });
  //   }
  // }

  // rejectCustomer(): void {
  //   if (this.customerId !== null) {
  //     this.customerService.rejectCustomer(this.customerId).subscribe({
  //       next: (response) => {
  //         console.log('Customer rejected successfully', response);
  //         this.router.navigate(['/feature/customer']);
  //       },
  //       error: (err) => {
  //         console.error('Error rejecting customer', err);
  //       }
  //     });
  //   }
  // }
  approveCustomer(): void {
    console.log('Customer approved');
    this.router.navigate(['/feature/customer']);
  }

  rejectCustomer(): void {
    console.log('Customer rejected');
    this.router.navigate(['/feature/customer']);
  }

  backClicked(): void {
    this._location.back();
  }
}
