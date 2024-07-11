import { Component, inject, OnInit } from '@angular/core';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import {Location} from '@angular/common';
import { items_province } from '../../../../shared/constants/data-province.constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { PostCodeService } from '../../../../shared/constants/post-code.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../../user-manager/interface/role.interface';


interface DataLocation {
  id:number,
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

@Component({
  selector: 'app-customer-add',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule,HttpClientModule],
  providers: [PostCodeService],
  templateUrl: './customer-add.component.html',
  styleUrl: './customer-add.component.scss'
})
export class CustomerAddComponent implements OnInit {
  currentUser!: IRole | null;
  items_provinces: DataLocation[] = items_province;
  filteredItemsProvince: DataLocation[] = items_province;
  customerForm!: FormGroup;
  customerBankForm!: FormGroup;
  customerId: number | null = null;
  isViewMode: boolean = false;
  isAdmin = false;
  isApproved = false;
  isUser = false;
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService)

  constructor(private _location: Location, private fb: FormBuilder
    ,private customerService: CustomerService,
    private router: Router ,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService
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
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      customer_id: ['1', Validators.required],
      customer_num: ['', Validators.required],
      customer_type: ['', Validators.required],
      site: ['00000', Validators.required],
    });
    this.customerBankForm = this.fb.group({
      bankName: ['']
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
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isUser = user.action.includes('user');
      }
    });
  }

  loadCustomerData(id: number): void {
    this.customerService.findCustomerById(id).subscribe((data: any) => {
      this.customerForm.patchValue(data);
    });
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
    console.log("value ", value);
    const selectedItem = this.items_provinces.find(item => item.postalCode === value);
    if (selectedItem) {
      this.customerForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      if (this.customerId) {
        this.onUpdate();  // Call update function if customerId exists
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

  onUpdate(): void {
    if (this.customerForm.valid && this.customerId) {
      this.customerService.updateData(this.customerId, this.customerForm.value).subscribe({
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
