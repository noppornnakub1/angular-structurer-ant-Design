import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { BankMasterService } from '../../../../shared/constants/bank-master.service';
import Swal from 'sweetalert2';
import { EmailService } from '../../../../shared/constants/email.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { prefixService } from '../../../../shared/constants/prefix.service';

export interface DataLocation {
  post_id: number,
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

export interface DataBank {
  bankId: number,
  bankName: string,
  bankNumber: string,
  alternateBankName: string,
  shortBankName: string,
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
  fullName: string,
  abbreviation: string,
  group_name: string
}

export interface DataGroup {
  group_name: string
}


export interface prefix {
  id: number,
  name: string;
  format: string;
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
  item_prefix: prefix[] = [];
  filteredItemsPrefix: prefix[] = [];
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
  selectType: string = '';
  listOfGroup: DataGroup[] = [];
  selectedSupplierGroup: string | null = null;
  selectedSupplierGroupAdd: string | null = null;
  emailError: string = '';
  isOneTime = false;
  typeCode: string = '';
  newSupnum: string = '';
  selectedFile: File | null = null;
  selectedFileAdd: File | null = null;
  private _cdr = inject(ChangeDetectorRef);
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService)
  listOfTypeVendor = [
    {
      title: 'Supplier',
    },
    {
      title: 'One Time',
    },
  ];
  selectedPrefix: string = '';
  nameInput: string = '';
  fullName: string = '';
  isCheckingDuplicate: boolean = false;
  constructor(private _location: Location, private fb: FormBuilder
    , private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef,
    private bankMasterService: BankMasterService,
    private emailService: EmailService,
    private modal: NzModalService,
    private prefixService: prefixService
  ) { }

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      tax_Id: ['', Validators.required],
      addressSup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      supplierNum: ['', Validators.required],
      supplierType: ['', Validators.required],
      site: ['00000', Validators.required],
      vat: [''],
      status: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      company: ['', Validators.required],
      type: ['Supplier', Validators.required],
      userId: [''],
      prefix: [''],
      mobile: ['', Validators.required],
    });
    this.supplierBankForm = this.fb.group({
      supbankId: [0],
      supplierId: [, Validators.required],
      nameBank: ['', Validators.required],
      branch: ['', Validators.required],
      accountNum: ['', Validators.required],
      supplierGroup: ['', Validators.required],
      accountName: ['', Validators.required],
      company: ['', Validators.required],
    });
    this.supplierBankFormAdd = this.fb.group({
      supbankId: [0],
      supplierId: [, Validators.required],
      nameBank: ['', Validators.required],
      branch: ['', Validators.required],
      accountNum: ['', Validators.required],
      supplierGroup: ['', Validators.required],
      accountName: ['', Validators.required],
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
      this.supplierBankFormAdd.disable();
    }
    this.postCodeService.getPostCodes().subscribe(data => {
      this.items_provinces = data;
      this.filteredItemsProvince = data;
    });
    this.prefixService.getPrefix().subscribe(data => {
      this.item_prefix = data;
      this.filteredItemsPrefix = data;
    });
    this.showSupplierBankForm = false;
    this.showSupplierBankFormAdd = false;
    this.getSupplierType();
    this.getDataBank();
    this.getDataPaymentMethod();
    this.getDataVAT();
    this.getDataCompany();

    // Subscribe to customer_type changes
    this.supplierForm.get('supplier_type')?.valueChanges.subscribe(value => {
      const supplierTypeId = this.getSupplierTypeId(value);
      if (supplierTypeId) {
        this.loadSupplierType(supplierTypeId);
      }
    });

    this.supplierForm.get('paymentMethod')?.valueChanges.subscribe(value => {
      this.toggleSupplierBankForm(value);
    });

    this.supplierForm.get('name')?.valueChanges.subscribe((value: string) => {
      this.supplierBankForm.patchValue({ account_name: value });
      this._cdr.detectChanges();
    });

    this.supplierForm.get('prefix')?.valueChanges.subscribe((prefix: string) => {
      this.selectedPrefix = prefix;
      this.updateNameWithPrefixChange();
    });
    this.checkRole();
  }

  onFileSelect(event: Event, fileType: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log(`File selected for ${fileType}:`, this.selectedFile);
    }
  }

  onFileSelectAdd(event: Event, fileType: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileAdd = input.files[0];
      console.log(`File selected for ${fileType}:`, this.selectedFileAdd);
    }
  }

  onNameBlur(): void {
    const nameControl = this.supplierForm.get('name');
    let nameValue = nameControl?.value || '';

    if (!nameValue) {
      return;
    }

    if (nameValue.endsWith(' จำกัด') || nameValue.endsWith(' จำกัด (มหาชน)')) {
      return;
    }

    if (this.selectedPrefix === 'บริษัทจำกัด') {
      nameControl?.setValue(`${nameValue} จำกัด`);
    } else if (this.selectedPrefix === 'บริษัทจำกัด (มหาชน)') {
      nameControl?.setValue(`${nameValue} จำกัด (มหาชน)`);
    }
  }

  updateNameWithPrefixChange(): void {
    const nameControl = this.supplierForm.get('name');
    let nameValue = nameControl?.value || '';

    if (!nameValue) {
      return;
    }

    nameValue = nameValue.replace(/ จำกัด \(มหาชน\)$/, '').replace(/ จำกัด$/, '');

    if (this.selectedPrefix === 'บริษัทจำกัด') {
      nameControl?.setValue(`${nameValue} จำกัด`);
    } else if (this.selectedPrefix === 'บริษัทจำกัด (มหาชน)') {
      nameControl?.setValue(`${nameValue} จำกัด (มหาชน)`);
    } else {
      nameControl?.setValue(nameValue);
    }
  }

  validateTaxId(event: any): void {
    const input = event.target.value;
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    this.supplierForm.patchValue({ tax_Id: numericValue });
    event.target.value = numericValue;
  }

  validateTel(event: any): void {
    const input = event.target.value;
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    this.supplierForm.patchValue({ tel: event.target.value });
  }

  validateMobile(event: any): void {
    const input = event.target.value;
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    this.supplierForm.patchValue({ mobile: event.target.value });
  }

  validateSite(event: any): void {
    const input = event.target.value;
    const numericValue = input.replace(/\D/g, '');
    this.supplierForm.patchValue({ site: numericValue });
    event.target.value = numericValue;
  }

  validateBranch(event: any): void {
    const input = event.target.value;
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    this.supplierBankForm.patchValue({ branch: event.target.value });
  }

  validateBranchAdd(event: any): void {
    const input = event.target.value;
    let numericValue = input.replace(/[^0-9-]/g, '');
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    this.supplierBankFormAdd.patchValue({ branch: event.target.value });
  }

  validateAccountNum(event: any): void {
    const input = event.target.value;
    const numericValue = input.replace(/\D/g, '');

    // อัปเดตค่าใน form control
    this.supplierBankForm.patchValue({ accountNum: numericValue });
    event.target.value = numericValue;
  }

  validateAccountNumAdd(event: any): void {
    const input = event.target.value;
    const numericValue = input.replace(/\D/g, '');

    // อัปเดตค่าใน form control
    this.supplierBankFormAdd.patchValue({ accounNnum: numericValue });
    event.target.value = numericValue;
  }

  toggleSupplierBankForm(value: string): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    this.getGruopName(currentUser.company);
    this.showSupplierBankForm = this.paymentMethods.includes(value);
    console.log("310", this.showSupplierBankForm);

    if (this.showSupplierBankForm) {
      this.supplierBankForm.patchValue({ accountName: this.supplierForm.get('name')?.value });
    }
    this._cdr.detectChanges();
  }

  showBankCopy() {
    this.showSupplierBankFormAdd = true;
    if (this.showSupplierBankFormAdd) {
      this.supplierBankFormAdd.patchValue({ accountName: this.supplierForm.get('name')?.value });
    }
  }

  hideBankCopy() {
    this.showSupplierBankFormAdd = false;
    if (this.showSupplierBankFormAdd) {
      this.supplierBankFormAdd.patchValue({ accountName: this.supplierForm.get('name')?.value });
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
      }

    });
  }

  loadSupplierData(id: number): void {
    this.supplierService.findSupplierById(id).subscribe((data: any) => {
      const postalCodeCombination = data.postalCode + '-' + data.subdistrict;
      this.supplierForm.patchValue({
        ...data,
        postalCode: postalCodeCombination
      });

      console.log("527", this.supplierForm.value);

      this.loadSupplierBank(id);
      this.getEventLogs(id);
    });
  }

  loadSupplierBank(id: number): void {
    this.supplierService.findSupplierBankBySupplierId(id).subscribe((data: any[]) => {
      this._cdr.detectChanges();
      if (data.length > 0) {
        if (!this.listOfGroup.some(group => group.group_name === data[0].supplierGroup)) {
          this.listOfGroup.push({ group_name: data[0].supplierGroup });
        }
        this.supplierBankForm.patchValue({
          supbankId: data[0].supbankId,
          supplierId: data[0].supplierId,
          nameBank: data[0].nameBank,
          branch: data[0].branch,
          accountNum: data[0].accountNum,
          supplierGroup: data[0].supplierGroup,
          accountName: data[0].accountName,
          company: data[0].company
        });
        this.showSupplierBankForm = true
      }
      if (data.length > 1) {
        if (!this.listOfGroup.some(group => group.group_name === data[1].supplierGroup)) {
          this.listOfGroup.push({ group_name: data[1].supplierGroup });
        }
        this.supplierBankFormAdd.patchValue({
          supbankId: data[1].supbankId,
          supplierId: data[1].supplierId,
          nameBank: data[1].nameBank,
          branch: data[1].branch,
          accountNum: data[1].accountNum,
          supplierGroup: data[1].supplierGroup,
          accountName: data[1].accountName,
          company: data[1].company
        });
        this.selectedSupplierGroupAdd = data[1].supplierGroup;
        this.showSupplierBankForm = true
        this.showSupplierBankFormAdd = true;
      }
    });
  }

  loadSupplierType(id: number): void {
    this.supplierService.findSupplierTypeById(id).pipe(debounceTime(300), distinctUntilChanged()).subscribe((data: any) => {
      const SupplierNumPrefix = data.codeFrom;
      this.typeCode = SupplierNumPrefix;
      if (SupplierNumPrefix === '2F') {
        this.supplierForm.patchValue({
          supplierNum: '-',
          postalCode: '-',
          province: '-',
          district: '-',
          subdistrict: '-',
          site: '',
          vat: '-',
          company: '-',
          paymentMethod: '-'
        });
      }
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
  }

  onPostalCodeChange(value: any): void {
    const [postalCode, subdistrict] = value.split('-');
    const selectedItem = this.items_provinces.find(item => item.postalCode === postalCode && item.subdistrict === subdistrict);
    if (selectedItem) {
      this.supplierForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province
      });

      this.cdr.markForCheck();
    } else {
    }
  }

  isSubdistrictMatching(item: DataLocation): boolean {
    const currentSubdistrict = this.supplierForm.get('subdistrict')?.value;
    return item.subdistrict === currentSubdistrict;
  }

  async onSubmit(): Promise<void> {
    if (this.isViewMode) {
      this.supplierForm.enable();
      this.supplierBankForm.enable();
      this.supplierBankFormAdd.enable();
    }

    if (this.supplierForm.value.email === '-') {
      this.emailError = '';
    }

    this.isSubmitting = true;
    if (this.supplierForm.valid) {
      const formValue = this.prepareFormData();
      const selectedPostItem = this.items_provinces.find(item => item.postalCode === formValue.postalCode && this.isSubdistrictMatching(item));
      if (selectedPostItem) {
        formValue.post_id = selectedPostItem.post_id;
      }
      if (this.suppilerId) {
        this.onUpdate(formValue);
      } else {
        this.supplierService.addData(formValue).subscribe({
          next: (response) => {

            if (response && response.supplier_id) {
              this.supplierBankForm.patchValue({ supplierId: response.supplierId, company: response.company });
              this.isIDTemp = response.supplierId
              console.log("518", this.showSupplierBankFormAdd);

              if (this.showSupplierBankForm && this.supplierBankForm.valid) {
                this.addBankData();
              }
              if (this.showSupplierBankFormAdd && this.supplierBankFormAdd.valid) {
                this.addBankData();
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
      if (this.emailError !== '') {
        Swal.fire({
          icon: 'error',
          title: 'Email ไม่ถูกต้อง',
          text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
          confirmButtonText: 'ปิด'
        });
        return;
      }
      else {
        if (!this.isCheckingDuplicate) {
          Swal.fire('Error!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        }
      }

    }
  }

  onUpdate(formValue: any): void {
    if (formValue && this.suppilerId) {
      this.supplierService.updateData(this.suppilerId, formValue).subscribe({
        next: (response) => {
          delete formValue.post_id;
          console.log(formValue);
          this.supplierForm.setValue(formValue);
          console.log("584", this.supplierForm.value);

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
      formValue.postalCode = selectedPostItem.postalCode;
      formValue.post_id = selectedPostItem.post_id;
    }
    formValue.user_id = currentUser.userId;
    return formValue;
  }

  getSupplierType(): void {
    this.supplierService.getSupplierType().subscribe({
      next: (response: any) => {
        this.listOfType = response;
        console.log(this.listOfType);
        
        if (this.isUser) {
          this.filteredDataType = this.listOfType.filter(type => ['LOCL', 'OSEA', 'ARTS'].includes(type.code));
        } else {
          this.filteredDataType = this.listOfType;
        }
        console.log("758", this.filteredDataType);
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  getEventLogs(SupplierId: number): void {
    this.supplierService.getLog(SupplierId).subscribe(
      (data) => {
        this.logs = data;
      },
      (error) => {
        console.error('Error fetching logs', error);
      }
    );
  }

  getDataBank(): void {
    this.bankMasterService.getBankData().subscribe({
      next: (response: any) => {
        this.listOfBank = response;
        this.filteredDataBank = response;
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  addBankData(): void {
    if (this.supplierBankForm.valid) {
      const bankFormValue = this.supplierBankForm.value;

      const formData = new FormData();
      formData.append('SupplierId', bankFormValue.supplier_id);
      formData.append('NameBank', bankFormValue.name_bank);
      formData.append('Branch', bankFormValue.branch);
      formData.append('AccountNum', bankFormValue.account_num);
      formData.append('SupplierGroup', bankFormValue.supplier_group);
      formData.append('AccountName', bankFormValue.account_name);
      formData.append('Company', bankFormValue.company);

      if (this.selectedFile) {
        formData.append('Files', this.selectedFile, this.selectedFile.name);
      }

      this.supplierService.addBankDataWithFiles(formData).subscribe({
        next: (response) => {
          console.log('Bank data with files added successfully (Main form)');
        },
        error: (err) => {
          console.error('Error adding bank data with files (Main form)', err);
        }
      });
    }

    if (this.supplierBankFormAdd && this.supplierBankFormAdd.valid) {
      const bankFormValueAdd = this.supplierBankFormAdd.value;

      const formDataAdd = new FormData();
      formDataAdd.append('SupplierId', bankFormValueAdd.supplier_id);
      formDataAdd.append('NameBank', bankFormValueAdd.name_bank);
      formDataAdd.append('Branch', bankFormValueAdd.branch);
      formDataAdd.append('AccountNum', bankFormValueAdd.account_num);
      formDataAdd.append('SupplierGroup', bankFormValueAdd.supplier_group);
      formDataAdd.append('AccountName', bankFormValueAdd.account_name);
      formDataAdd.append('Company', bankFormValueAdd.company);

      if (this.selectedFileAdd) {
        formDataAdd.append('Files', this.selectedFileAdd, this.selectedFileAdd.name);
      }

      this.supplierService.addBankDataWithFiles(formDataAdd).subscribe({
        next: (response) => {
          console.log('Bank data with files added successfully (Add form)');
        },
        error: (err) => {
          console.error('Error adding bank data with files (Add form)', err);
        }
      });
    }
  }

  onUpdateSupplierBank(): void {
    const bankId = this.supplierBankForm.get('supbank_id')?.value;

    if (this.supplierBankForm.valid && this.suppilerId) {
      this.supplierService.updateBankData(bankId, this.supplierBankForm.value).subscribe({
        next: (response) => {


          this.router.navigate(['/feature/supplier']);
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
    }
    if (this.supplierBankFormAdd.valid && this.suppilerId) {
      const bankId = this.supplierBankFormAdd.get('supbank_id')?.value;

      this.supplierService.updateBankData(bankId, this.supplierBankFormAdd.value).subscribe({
        next: (response) => {

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
    console.log(this.showSupplierBankForm);
    console.log("744", this.supplierForm.valid, this.supplierBankForm.valid);

    if (this.showSupplierBankForm = true) {
      if (this.supplierForm.valid) {
        const log = {
          id: 0,
          userId: currentUser.userId || 0,
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

            this.isIDTemp = 0;
          },
          error: (err) => {
            console.error('Error adding log data', err);
          }
        });
      } else {

      }
    }
    else {
      if (this.supplierForm.valid && this.supplierBankForm.valid) {
        const log = {
          id: 0,
          userId: currentUser.userId || 0,
          username: currentUser.username || 'string',
          email: currentUser.email || 'string',
          status: this.supplierForm.get('status')?.value || 'Draft',
          customer_id: 0, // ถ้ามีค่า customer_id สามารถใส่ได้
          supplier_id: this.supplierBankForm.get('supplier_id')?.value || 0, // อ้างอิง id จาก supplierForm
          time: new Date().toISOString() // หรือใส่เวลาที่คุณต้องการ
        };
        this.supplierService.insertLog(log).subscribe({
          next: (response) => {
            console.log("Save Event Log สำเร็จ", response);

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
            const latestData = dataList.reduce((prev, current) => (prev.id > current.id) ? prev : current);
            const postalCodeCombination = latestData.postalCode + '-' + latestData.subdistrict;
            this.supplierForm.patchValue({
              ...latestData,
              postalCode: postalCodeCombination,
              status: ''
            });
          } else {

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
        this.listOfPaymentMethod = response;
        console.log(this.listOfPaymentMethod);

        if (this.isUser) {
          this.filteredDataPaymentMethod = this.listOfPaymentMethod.filter(type => ['Cheque', 'Transfer'].includes(type.paymentMethodName));
        } else {
          this.filteredDataPaymentMethod = this.listOfPaymentMethod;
        }
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }
  getDataVAT(): void {
    this.supplierService.getDataVat().subscribe({
      next: (response: any) => {

        this.listOfVat = response;


        this.filteredDataVat = response;
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  getGruopName(company: string): void {
    this.supplierService.GetAllGroups().subscribe({
      next: (response: any) => {
        this.listOfGroup = response.map((groupName: string) => ({ group_name: groupName }));
        this._cdr.markForCheck();
      },
      error: () => {
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

        if (CheckcurrentUser.company === 'ALL') {
          this.listOfCompany = response;
          this.filteredDataompany = response;
          console.log(response);

        } else {
          this.listOfCompany = response.filter((company: DataCompany) => userCompanies.includes(company.abbreviation));
          this.filteredDataompany = this.listOfCompany;
        }
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  validateEmail() {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,4}){1,2}$/;
    if (!this.supplierForm.value.email) {
      this.emailError = 'Email is required';
    } else if (!emailPattern.test(this.supplierForm.value.email)) {
      if (this.supplierForm.value.email === '-') {
        this.emailError = '';
      }
      else {
        this.emailError = 'Email is wrong emailPattern';
      }
    } else {
      this.emailError = '';
    }
    this.cdr.detectChanges();
  }

  async checkSave(event: Event) {
    console.log(this.nameInput)
    console.log(this.supplierForm.value.name);
    this.validateEmail()
    if (this.emailError != '') {
      console.log(this.emailError);
      Swal.fire({
        icon: 'error',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
      return;
    }
    else {
      try {
        this.supplierForm.value.supplierNum = '-'
        await this.CheckDupplicateData();

        await this.save(event);
      } catch (error) {
        console.error('Error occurred:', error);
      }
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

  async save(event: Event): Promise<void> {
    console.log(this.suppilerId);

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
   // รอให้ Swal ทำงานและรับค่าตอบสนองจากผู้ใช้
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to save the changes?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, save it!'
  });

  // ตรวจสอบการตอบสนองจาก Swal
  if (result.isConfirmed) {
    if (this.suppilerId == null) {
      this.setStatusAndSubmit('Draft');
    } else {
      if (this.isApproved) {
        this.setStatusAndSubmit('Pending Approved By ACC');
        console.log("เข้า approve");
      } else {
        this.setStatusAndSubmit('Draft');
      }
    }
  }
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
          const newStatus = currentStatus === 'Pending Approved By ACC' ? 'Pending Approve By FN' : 'Pending Approved By ACC';
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
            this.setStatusAndSubmit(newStatus);
          }
        });
      } else {
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


  async setStatusAndSubmit(status: string): Promise<void> {
    this.supplierForm.patchValue({ status });
    if (this.suppilerId == null) {
      this.supplierForm.patchValue({ supplierNum: this.newSupnum });
      this.supplierForm.patchValue({ userId: this.currentUser?.id });
    }
    console.log("1170", this.supplierForm.value);

    await this.onSubmit();
  }

  sendEmailNotification(): void {
    const supplierNum = this.supplierForm.get('supplierNum')?.value;
    if (this.supplierForm.get('status')?.value === 'Pending Approved By ACC' && this.supplierBankForm.valid == false) {
      const company = this.supplierForm.get('company')?.value;

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

  onSupplierTypeChange(value: string): void {
    this.selectType = value;
  }

  isOverseaSupplier(): boolean {
    return this.selectType === 'OSEA';
  }

  onSupplierTypeOneChange(value: string) {
    if (value === 'One Time') {
      this.isOneTime = true;
      this.supplierForm.patchValue({
        supplierNum: '-',
        site: '-',
        supplierType: '-'
      });
    } else {
      this.isOneTime = false;
    }
  }

  CheckDupplicateData(): Promise<void> {
    this.isCheckingDuplicate = true; // เริ่มกระบวนการตรวจสอบข้อมูลซ้ำ
  
    return new Promise((resolve, reject) => {
      console.log('Inside CheckDupplicateData');
      
      const foundItem = this.filteredDataType.find(item => item.code === this.supplierForm.value.supplierType);
      if (foundItem) {
        this.typeCode = foundItem.codeFrom;
        console.log('codeFrom:', this.typeCode);
      }
  
      if (this.supplierForm.value.supplierNum === '-') {
        const tax = this.supplierForm.value.tax_Id.trim();
        const type = this.typeCode.trim();
        const key = `${tax}-${type}`;
        console.log(key);
  
        this.supplierService.CheckDupplicateSupplier(key).subscribe({
          next: (response: any) => {
            if (response && response.length > 0) {
              Swal.fire({
                icon: 'error',
                title: 'ข้อมูลซ้ำ',
                text: 'มีข้อมูล Supplier นี้อยู่ในฐานข้อมูลอยู่แล้ว โปรดตรวจสอบ TaxID และ Type อีกครั้ง',
                confirmButtonText: 'ปิด'
              });
              this.isCheckingDuplicate = false; // กระบวนการตรวจสอบข้อมูลซ้ำเสร็จสิ้น
              reject('Duplicate data found'); // เรียก reject
            } else {
              this.getNumMaxSupplier().then(() => {
                this.isCheckingDuplicate = false; // กระบวนการตรวจสอบข้อมูลซ้ำเสร็จสิ้น
                resolve();
              }).catch(err => {
                this.isCheckingDuplicate = false; // กระบวนการตรวจสอบข้อมูลซ้ำเสร็จสิ้น
                reject(err);
              });
            }
          },
          error: (err) => {
            if (err === 'No data found.') {
              this.getNumMaxSupplier().then(() => {
                this.isCheckingDuplicate = false; // กระบวนการตรวจสอบข้อมูลซ้ำเสร็จสิ้น
                resolve();
              }).catch(err => {
                this.isCheckingDuplicate = false; // กระบวนการตรวจสอบข้อมูลซ้ำเสร็จสิ้น
                reject(err);
              });
            } else {
              this.isCheckingDuplicate = false; // กระบวนการตรวจสอบข้อมูลซ้ำเสร็จสิ้น
              reject(err);
            }
          }
        });
      } else {
        this.isCheckingDuplicate = false; // ไม่ต้องทำการตรวจสอบข้อมูลซ้ำ
        resolve();
      }
    });
  }
  
  
  // ฟังก์ชันใหม่เพื่อแยกการดึงข้อมูลหมายเลข
  getNumMaxSupplier(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.supplierService.GetNumMaxSupplier(this.typeCode).subscribe({
        next: (response: any) => {
          if (!response || response.length === 0 || response[0]["MAX(NUM)"] === null) {
            this.supplierForm.patchValue({ supplierNum: '' });
          } else {
            const max = response[0]["MAX(NUM)"];
            const maxStr = String(max);
            const matchResult = maxStr.match(/^(\d*[A-Za-z]+)(\d+)$/);
            const prefix = matchResult ? matchResult[1] : '';
            const numPart = matchResult ? matchResult[2] : '0';
            const nextNum = String(parseInt(numPart, 10) + 1).padStart(numPart.length, '0');
            const newCustomerNum = `${prefix}${nextNum}`;
            this.newSupnum = newCustomerNum;
            this.supplierForm.patchValue({ supplierNum: newCustomerNum });
            console.log("New Customer Num:", this.supplierForm.value);
          }
  
          this._cdr.markForCheck();
          resolve(); // เรียก resolve เมื่อเสร็จสิ้น
        },
        error: (err) => {
          console.error('Error while fetching max supplier number', err);
          reject(err); // เรียก reject เมื่อเกิดข้อผิดพลาด
        }
      });
    });
  }
  

}