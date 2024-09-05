import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PostCodeService } from '../../../../shared/constants/post-code.service';
import { HttpClientModule, HttpParams } from '@angular/common/http';
import { IsupplierType } from '../../interface/supplierType.interface';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../../user-manager/interface/role.interface';
import { BankMasterService } from '../../../../shared/constants/bank-master.service';
import Swal from 'sweetalert2';
import { EmailService } from '../../../../shared/constants/email.service';
import { SupplierComponent } from '../supplier/supplier.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface DataLocation {
  post_id: number,
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

export interface DataBank {
  bank_id: number,
  bank_name: string,
  bank_number: string,
  alternate_bank_name: string,
  short_bank_name: string,
}

export interface DataPaymentMethod {
  id: number,
  paymentMethodName: string,
  description: string
}

export interface DataVat {
  id: number,
  inputTaxCode: string,
  interimTaxAccount: string,
  taxAccount: number,
  taxDescription: string,
  taxRate: string,

}

export interface DataCompany {
  com_code: number,
  full_name: string,
  abbreviation: string,
  group_name: string
}

export interface DataGroup {
  group_name: string
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
  listOfBank: DataBank[] = [];
  filteredDataBank: DataBank[] = [];
  listOfPaymentMethod: DataPaymentMethod[] = [];
  filteredDataPaymentMethod: DataPaymentMethod[] = [];
  listOfVat: DataVat[] = [];
  filteredDataVat: DataVat[] = [];
  listOfCompany: DataCompany[] = [];
  filteredDataompany: DataCompany[] = [];
  items_provinces: DataLocation[] = [];
  filteredItemsProvince: DataLocation[] = [];
  logs: any[] = [];
  reasonTemp: string = '';
  supplierForm!: FormGroup;
  supplierBankForm!: FormGroup;
  supplierBankFormAdd!: FormGroup;

  suppilerId: number | null = null;
  isViewMode: boolean = false;
  isAdmin = false;
  isApproved = false;
  isApprovedFN = false;
  isUser = false;
  isSubmitting: boolean = false;
  showSupplierBankForm: boolean = false;
  showSupplierBankFormAdd: boolean = false;
  isBankFormVisible: boolean = false;
  paymentMethods = ['Transfer', 'Transfer_Employee'];
  isIDTemp = 0;
  isNameTemp = '';
  isLength = false;
  listOfGroup: DataGroup[] = [];
  selectedSupplierGroup: string | null = null;
  selectedSupplierGroupAdd: string | null = null;
  emailError: string = '';
  private _cdr = inject(ChangeDetectorRef);
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService)

  constructor(private _location: Location, private fb: FormBuilder
    , private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef,
    private bankMasterService: BankMasterService,
    private emailService: EmailService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
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
      supplier_num: ['', Validators.required],
      supplier_type: ['', Validators.required],
      site: ['00000', Validators.required],
      vat: [''],
      status: ['', Validators.required],
      payment_method: ['', Validators.required],
      company: ['', Validators.required],
    });
    this.supplierBankForm = this.fb.group({
      supbank_id: [0],
      supplier_id: [, Validators.required],
      name_bank: ['', Validators.required],
      branch: ['', Validators.required],
      account_num: ['', Validators.required],
      supplier_group: ['', Validators.required],
      account_name: ['', Validators.required],
      company: ['', Validators.required],
    });
    this.supplierBankFormAdd = this.fb.group({
      supbank_id: [0],
      supplier_id: [, Validators.required],
      name_bank: ['', Validators.required],
      branch: ['', Validators.required],
      account_num: ['', Validators.required],
      supplier_group: ['', Validators.required],
      account_name: ['', Validators.required],
      company: ['', Validators.required],
    });


    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.suppilerId = +id;
        this.loadSupplierData(this.suppilerId);
        this.isIDTemp = this.suppilerId;
      }
    });
    if (this.router.url.includes('/view/')) {
      this.isViewMode = true;
      this.supplierForm.disable();
      this.supplierBankForm.disable();
      this.supplierBankFormAdd.disable();  // ทำให้ฟอร์มไม่สามารถแก้ไขได้
    }
    this.postCodeService.getPostCodes().subscribe(data => {
      console.log(data)
      this.items_provinces = data;
      this.filteredItemsProvince = data;
    });
    this.showSupplierBankForm = false;
    this.showSupplierBankFormAdd = false;
    this.getSupplierType();
    this.getDataBank();
    this.getDataPaymentMethod();
    this.getDataVAT();
    this.getDataCompany();

    // Subscribe to customer_type changes
    this.supplierForm.get('supplier_type')!.valueChanges.subscribe(value => {
      const supplierTypeId = this.getSupplierTypeId(value);
      if (supplierTypeId) {
        this.loadSupplierType(supplierTypeId); // เรียกใช้ฟังก์ชันนี้เมื่อมีการเปลี่ยนแปลงค่า supplier_type
      }
    });

    this.supplierForm.get('payment_method')?.valueChanges.subscribe(value => {
      this.toggleSupplierBankForm(value);
    });
    // this.supplierBankForm.get('name_bank')!.valueChanges.subscribe(value => {
    //   this.onBankNameChange(value);
    // });

    this.checkRole();
  }

  toggleSupplierBankForm(value: string): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    this.getGruopName(currentUser.company);
    this.showSupplierBankForm = this.paymentMethods.includes(value);
    if (this.showSupplierBankForm) {
      this.supplierBankForm.patchValue({ account_name: this.supplierForm.get('name')?.value });
    }
    this._cdr.detectChanges();
  }

  showBankCopy() {
    this.showSupplierBankFormAdd = true;
    if (this.showSupplierBankFormAdd) {
      this.supplierBankFormAdd.patchValue({ account_name: this.supplierForm.get('name')?.value });
    }
  }


  onPaymentMethodChange(value: string): void {
    this.toggleSupplierBankForm(value);
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      console.log(this.currentUser);
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isApprovedFN = user.action.includes('approvedFN');
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
    this.loadSupplierBank(id);
    this.getEventLogs(id)
  }

  loadSupplierBank(id: number): void {
    this.supplierService.findSupplierBankBySupplierId(id).subscribe((data: any[]) => {
      this._cdr.detectChanges();
      console.log("loadsupbank", data);
      if (data.length > 0) {
        if (!this.listOfGroup.some(group => group.group_name === data[0].supplier_group)) {
          this.listOfGroup.push({ group_name: data[0].supplier_group });
        }
        this.supplierBankForm.patchValue({
          supbank_id: data[0].supbank_id,
          supplier_id: data[0].supplier_id,
          name_bank: data[0].name_bank,
          branch: data[0].branch,
          account_num: data[0].account_num,
          supplier_group: data[0].supplier_group,
          account_name: data[0].account_name,
          company: data[0].company
        });
        if (data.length > 1) {
          if (!this.listOfGroup.some(group => group.group_name === data[1].supplier_group)) {
            this.listOfGroup.push({ group_name: data[1].supplier_group });
          }
          this.supplierBankFormAdd.patchValue({
            supbank_id: data[1].supbank_id,
            supplier_id: data[1].supplier_id,
            name_bank: data[1].name_bank,
            branch: data[1].branch,
            account_num: data[1].account_num,
            supplier_group: data[1].supplier_group,
            account_name: data[1].account_name,
            company: data[1].company
          });
          this.selectedSupplierGroupAdd = data[1].supplier_group;
          this.showSupplierBankFormAdd = true; // แสดงฟอร์มที่สอง

        }
      }
    });
  }

  loadSupplierType(id: number): void {
    this.supplierService.findSupplierTypeById(id).pipe(debounceTime(300), distinctUntilChanged()).subscribe((data: any) => {
      const SupplierNumPrefix = data.code_from;
      this.supplierService.getTopSupplierByType(data.code).subscribe(topSupplierData => {
        let newSupplierNum: string;
        console.log('before', topSupplierData.supplier_num);

        if (topSupplierData.supplier_num === '000') {
          // ถ้าไม่เจอข้อมูล ให้ใช้ค่า default
          newSupplierNum = SupplierNumPrefix + '000001';
        } else {
          // ถ้าเจอข้อมูล ใช้ค่า supplier_num ที่ดึงมาแล้ว increment
          newSupplierNum = this.incrementSupplierNum(topSupplierData.supplier_num, SupplierNumPrefix);
        }

        this.supplierForm.patchValue({ supplier_num: newSupplierNum });
        this.supplierForm.patchValue({ id: 0 });
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
   
    if (this.isViewMode) {
      this.supplierForm.enable(); // Enable form temporariliy for validation
    }
    if (this.isSubmitting) {
      return; // ป้องกันการ submit ซ้ำ
    }
    this.isSubmitting = true;
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

            if (response && response.supplier_id) {
              this.supplierBankForm.patchValue({ supplier_id: response.supplier_id, company: response.company });
              this.isIDTemp = response.supplier_id
              console.log('หลังจาก map supplier_id , company', this.supplierBankForm);
              console.log('หลังจาก map supplier_id', this.isIDTemp);

              if (this.showSupplierBankForm = true) {
                this.addBankData();
                console.log('Data Bank added successfully', response);
              }
              else if (this.showSupplierBankFormAdd = true) {
                this.addBankData();
                console.log('Data Bank added successfully', response);
              }
              this.insertLog();
              Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Your data has been saved.',
                showConfirmButton: false,
                timer: 1500
              });
              this.router.navigate(['/feature/supplier']);
            } else {
              console.error('Response does not contain supplier_id', response);
            }
          },
          error: (err) => {
            Swal.fire('Error!', 'There was an error saving your data.', 'error');
          }
        });
      }
    } else {
      this.supplierForm.markAllAsTouched();
      Swal.fire('Error!', 'กรุณาตรวจสอบข้อมูลของคุณให้ครบถ้วน.', 'error');

    }
  }


  onUpdate(formValue: any): void {
    if (this.supplierForm.valid && this.suppilerId) {
      this.supplierService.updateData(this.suppilerId, formValue).subscribe({
        next: (response) => {
          console.log('Data updated successfully', response);
          if (this.showSupplierBankForm = false) {
            this.insertLog();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your data has been updated.',
              showConfirmButton: false,
              timer: 1500
            });
            this.sendEmailNotification();
          }
          else {
            this.onUpdateSupplierBank();
            this.insertLog();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your data has been updated.',
              showConfirmButton: false,
              timer: 1500
            });
            console.log('Update func UpdateLog updated successfully', response);
            this.sendEmailNotification();
          }
          this.router.navigate(['/feature/supplier']);
        },
        error: (err) => {
          Swal.fire('Error!', 'There was an error saving your data.', 'error');
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
      this.supplierBankForm.markAllAsTouched();
      Swal.fire('Error!', 'กรุณาตรวจสอบข้อมูลของคุณให้ครบถ้วน', 'error');
    }

  }


  prepareFormData(): any {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    const formValue = { ...this.supplierForm.value };
    const selectedPostItem = this.items_provinces.find(item => {
      const postalCode = formValue.postalCode.split('-')[0];
      return item.postalCode === postalCode && this.isSubdistrictMatching(item);
    });

    if (selectedPostItem) {
      formValue.postalCode = selectedPostItem.postalCode; // ใช้ค่า postalCode ที่ถูกต้อง
      formValue.post_id = selectedPostItem.post_id; // เพิ่ม post_id เข้าไปใน formValue
    }
    formValue.user_id = currentUser.user_id;
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

  getEventLogs(SupplierId: number): void {
    this.supplierService.getLog(SupplierId).subscribe(
      (data) => {
        this.logs = data;
        console.log(this.logs);
      },
      (error) => {
        console.error('Error fetching logs', error);
      }
    );
  }

  getDataBank(): void {
    this.bankMasterService.getBankData().subscribe({
      next: (response: any) => {
        console.log(response)
        this.listOfBank = response;
        this.filteredDataBank = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }

  addBankData(): void {
    const bankFormValue = this.supplierBankForm.value;
    console.log('Bank form value before submitting:', bankFormValue);  // Add logging here
    if (this.supplierBankForm.valid) {
      this.supplierService.addBankData(bankFormValue).subscribe({
        next: (response) => {
          console.log('Bank data added successfully', response);
        },
        error: (err) => {
          console.error('Error adding bank data', err);
        }
      });
    }
    if (this.supplierBankFormAdd) {
      const bankFormValue = this.supplierBankFormAdd.value;
      console.log('Bank form value before submitting:', bankFormValue);  // Add logging here
      if (this.supplierBankFormAdd.valid) {
        this.supplierService.addBankData(bankFormValue).subscribe({
          next: (response) => {
            console.log('Bank data added successfully', response);
          },
          error: (err) => {
            console.error('Error adding bank data', err);
          }
        });
      }
    }
  }

  onUpdateSupplierBank(): void {
    const bankId = this.supplierBankForm.get('supbank_id')?.value;
    console.log("bankid", bankId)
    if (this.supplierBankForm.valid && this.suppilerId) {
      this.supplierService.updateBankData(bankId, this.supplierBankForm.value).subscribe({
        next: (response) => {
          console.log('Data bank updated successfully', response);

          this.router.navigate(['/feature/supplier']);
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
    }
    if (this.supplierBankFormAdd.valid && this.suppilerId) {
      const bankId = this.supplierBankFormAdd.get('supbank_id')?.value;
      console.log("bankid If2", bankId)
      this.supplierService.updateBankData(bankId, this.supplierBankFormAdd.value).subscribe({
        next: (response) => {
          console.log('Data bank updated successfully', response);

          this.router.navigate(['/feature/supplier']);
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
      this.supplierBankForm.markAllAsTouched();
      Swal.fire('Error!', 'There was an error saving your data.', 'error');
    }
  }

  insertLog(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (this.showSupplierBankForm = true) {
      console.log('log เขา If ซ่อนการ์ด', this.isIDTemp);
      if (this.supplierForm.valid) {
        const log = {
          id: 0,
          user_id: currentUser.user_id || 0,
          username: currentUser.username || 'string',
          email: currentUser.email || 'string',
          status: this.supplierForm.get('status')?.value || 'Draft',
          customer_id: 0, // ถ้ามีค่า customer_id สามารถใส่ได้
          supplier_id: this.isIDTemp || 0, // อ้างอิง id จาก supplierForm
          time: new Date().toISOString(),
          reject_reason: this.reasonTemp // หรือใส่เวลาที่คุณต้องการ
        };
        this.supplierService.insertLog(log).subscribe({
          next: (response) => {
            console.log('log data added successfully', response);
            this.isIDTemp = 0;
          },
          error: (err) => {
            console.error('Error adding log data', err);
          }
        });
      } else {
        console.error('Supplier form or supplier bank form is not valid');
      }
    }
    else {
      if (this.supplierForm.valid && this.supplierBankForm.valid) {
        const log = {
          id: 0,
          user_id: currentUser.user_id || 0,
          username: currentUser.username || 'string',
          email: currentUser.email || 'string',
          status: this.supplierForm.get('status')?.value || 'Draft',
          customer_id: 0, // ถ้ามีค่า customer_id สามารถใส่ได้
          supplier_id: this.supplierBankForm.get('supplier_id')?.value || 0, // อ้างอิง id จาก supplierForm
          time: new Date().toISOString() // หรือใส่เวลาที่คุณต้องการ
        };
        this.supplierService.insertLog(log).subscribe({
          next: (response) => {
            console.log('log data added successfully', response);
          },
          error: (err) => {
            console.error('Error adding log data', err);
          }
        });
      } else {
        console.error('Supplier form or supplier bank form is not valid');
      }
    }

  }

  getTaxIdData(): void {
    const taxId = this.supplierForm.get('tax_Id')?.value;

    if (taxId) {
      this.supplierService.getDataByTaxId(taxId).subscribe({
        next: (dataList: any[]) => {
          if (dataList.length > 0) {
            // สมมติว่าเลือกแถวที่มี Id สูงสุด
            const latestData = dataList.reduce((prev, current) => (prev.id > current.id) ? prev : current);

            const postalCodeCombination = latestData.postalCode + '-' + latestData.subdistrict;
            this.supplierForm.patchValue({
              ...latestData,
              postalCode: postalCodeCombination,
              status: ''
            });
          } else {
            console.log('No data found for the given Tax ID');
          }
        },
        error: (err) => {
          console.error('Error fetching data by Tax ID', err);
        }
      });
    }
  }

  getDataPaymentMethod(): void {
    this.supplierService.getDataPaymentMethod().subscribe({
      next: (response: any) => {
        console.log(response)
        this.listOfPaymentMethod = response;
        this.filteredDataPaymentMethod = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }
  getDataVAT(): void {
    this.supplierService.getDataVat().subscribe({
      next: (response: any) => {
        console.log(response)
        this.listOfVat = response;
        console.log('Vat', this.listOfVat);

        this.filteredDataVat = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }

  getGruopName(company: string): void {
    this.supplierService.GetGroupNames(company).subscribe({
      next: (response: any) => {
        this.listOfGroup = response.map((groupName: string) => ({ group_name: groupName }));
        console.log("Group", this.listOfGroup);
        // this.filteredData = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }

  getDataCompany(): void {
    const CheckcurrentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userCompanies = CheckcurrentUser.company ? CheckcurrentUser.company.split(',') : [];

    if (userCompanies.length === 0) {
      console.error('No company information found in local storage');
      return;
    }

    this.supplierService.getDataCompany().subscribe({
      next: (response: any) => {
        console.log(response);
        if (CheckcurrentUser.company === 'ALL') {
          this.listOfCompany = response;
          this.filteredDataompany = response;
        } else {
          // Filter the company list based on the user's companies
          this.listOfCompany = response.filter((company: DataCompany) => userCompanies.includes(company.abbreviation));
          this.filteredDataompany = this.listOfCompany;
        }
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }

  validateEmail() {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!this.supplierForm.value.email) {
      this.emailError = 'Email is required';
      console.log("email ว่าง");

    } else if (!emailPattern.test(this.supplierForm.value.email)) {
      this.emailError = 'Email is wrong emailPattern';
      console.log("email ผิด");
    } else {
      this.emailError = '';
    }
    this.cdr.detectChanges();
  }

  checkSave(event: Event){
    if (this.emailError != '') {
      Swal.fire({
        icon: 'error',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
      return;
    }
    else{
      this.save(event)
    }
  }

  cancel(event: Event): void {
    event.preventDefault();
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to cancel ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.setStatusAndSubmit('Cancel');
      }
    });

  }

  save(event: Event): void {
    if (this.emailError != '') {
      Swal.fire({
        icon: 'error',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
      return;
    }
    event.preventDefault();
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to save the changes?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.setStatusAndSubmit('Draft');
      }
    });

  }

  submit(event: Event): void {
    event.preventDefault();
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to save the changes?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!'
    }).then((result) => {
      if (result.isConfirmed) {
        if (result.isConfirmed) {
          const currentStatus = this.supplierForm.get('status')?.value;
          const newStatus = currentStatus === 'Pending Approve By ACC' ? 'Pending Approve By FN' : 'Pending Approved By ACC';
          this.setStatusAndSubmit(newStatus);
        }
      }
    });

  }

  approve(event: Event): void {
    event.preventDefault();
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to save the changes?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const currentStatus = this.supplierForm.get('status')?.value;
        const newStatus = currentStatus === 'Approved By ACC' ? 'Approved By FN' : 'Approved By ACC';
        this.setStatusAndSubmit(newStatus);
      }
    });
  }

  reject(event: Event): void {
    event.preventDefault();
    this.showRejectPopup().then((rejectReason) => {
      if (rejectReason !== undefined) {
        Swal.fire({
          title: 'Are you sure?',
          text: "Do you want to save the changes?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, save it!'
        }).then((result) => {
          if (result.isConfirmed) {
            const currentStatus = this.supplierForm.get('status')?.value;
            const newStatus = currentStatus === 'Approved By ACC' ? 'Reject By FN' : 'Reject By ACC';
            this.reasonTemp = rejectReason;
            this.setStatusAndSubmit(newStatus); // ส่งเหตุผลไปด้วย
          }
        });
      } else {
        // Swal.fire('Error!', 'กรุณากรอกเหตุผล', 'error');
      }
    });
  }

  showRejectPopup(): Promise<string | undefined> {
    return Swal.fire({
      title: 'Reject Reason',
      input: 'textarea',
      inputLabel: 'Please provide a reason for rejection',
      inputPlaceholder: 'Enter your reason here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'กรุณากรอกเหตุผล'
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        return result.value;
      }
      return undefined;
    });
  }


  setStatusAndSubmit(status: string): void {
    this.supplierForm.patchValue({ status });
    console.log('Setting status to', status); // ตรวจสอบการตั้งค่าสถานะ
    this.onSubmit();
  }

  sendEmailNotification(): void {
    console.log('log ทฟรส', this.supplierForm.get('status')?.value, this.supplierBankForm.valid);
    const supplierNum = this.supplierForm.get('supplier_num')?.value;
    if (this.supplierForm.get('status')?.value === 'Pending Approved By ACC' && this.supplierBankForm.valid == false) {
      const company = this.supplierForm.get('company')?.value;
      
      // เรียกใช้ฟังก์ชันเพื่อค้นหาผู้ใช้งาน
      this.supplierService.findApproversByCompany(company).subscribe(
        (approvers) => {
          approvers.forEach((approver: any) => {
            const to = approver.email;
            const subject = 'Approval Notification';
            const body = `สถานะของ Supplier Number:${supplierNum} 
            ได้เปลี่ยนเป็น ${this.supplierForm.get('status')?.value} 
            รบกวนเข้ามาดำเนินการตรวจสอบและ Approve ในลำดับต่อไป`;

            this.emailService.sendEmail(to, subject, body).subscribe(
              (response) => {
                console.log('Email sent successfully', response);
              },
              (error) => {
                console.error('Error sending email', error);
              }
            );
          });
        },
        (error) => {
          console.error('Error finding approvers', error);
        }
      );
    }
    else if (this.supplierForm.get('status')?.value === 'Approved By ACC' && !this.supplierBankForm.valid) {
      const company = this.supplierForm.get('company')?.value;
      // เรียกใช้ฟังก์ชันเพื่อค้นหาผู้ใช้งาน
      this.supplierService.findApproversFNByCompany(company).subscribe(
        (approvers) => {
          approvers.forEach((approver: any) => {
            const to = approver.email;
            const subject = 'Approval Notification';
            const body = `สถานะของ Supplier Number:${supplierNum} 
            ได้เปลี่ยนเป็น ${this.supplierForm.get('status')?.value} 
            รบกวนเข้ามาดำเนินการตรวจสอบและ Approve ในลำดับต่อไป`;

            this.emailService.sendEmail(to, subject, body).subscribe(
              (response) => {
                console.log('Email sent successfully', response);
              },
              (error) => {
                console.error('Error sending email', error);
              }
            );
          });
        },
        (error) => {
          console.error('Error finding approvers', error);
        }
      );
    }
  }



  backClicked(event: Event) {
    event.preventDefault();
    this._location.back();
  }
}
