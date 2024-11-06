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
import { DataCompany, DataLocation, prefix } from '../../../supplier/pages/supplier-add/supplier-add.component';
import Swal from 'sweetalert2';
import { EmailService } from '../../../../shared/constants/email.service';
import { debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';
import { prefixService } from '../../../../shared/constants/prefix.service';
import { ValidationService } from '../../../../shared/constants/ValidationService';
import { UserService } from '../../../user-manager/services/user.service';
import { SupplierService } from '../../../supplier/services/supplier.service';
import { environment } from '../../../../../environments/environment';
import { Observable, forkJoin } from 'rxjs';
import { ICustomer } from '../../interface/customer.interface';

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
  customerId: number | null = null;
  isViewMode: boolean = false;
  isAdmin = false;
  isApproved = false;
  isApprovedFN = false;
  isUser = false;
  isSubmitting: boolean = false;
  logs: any[] = [];
  reasonTemp: string = '';
  selectType: string = '';
  private readonly authService = inject(AuthService)
  private _cdr = inject(ChangeDetectorRef);
  emailError: string = '';
  originalData: any;
  listDataByTaxId: any[] = [];
  isDupplicate: boolean = false;
  typeCode: string = '';
  newCusnum: string = '';
  tempCusForm: any;
  item_prefix: prefix[] = [];
  filteredItemsPrefix: prefix[] = [];
  selectedPrefix: string = '';
  files = [
    { fileName: 'ใบขอเปิด Customer', fileType: 'fileReq', filePath: '' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'fileCertificate', filePath: '' },
  ];
  file: any;
  filess: Array<{ fileName: string; fileType: string; filePath: string }> = [];
  displayFiles: Array<{ fileName: string; filePath: string }> = [];
  listfile: File[] = [];
  uploadedFiles: any[] = [];
  idreq: number = 0;
  emailreq: string = '';
  isCheckingDuplicate: boolean = false;
  listOfCompany: DataCompany[] = [];
  filteredDataompany: DataCompany[] = [];
  constructor(private _location: Location, private fb: FormBuilder
    , private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef,
    private emailService: EmailService,
    private prefixService: prefixService,
    private validationService: ValidationService,
    private userService: UserService,
    private supplierService: SupplierService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.customerForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      taxId: ['', Validators.required],
      addressSup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['-', Validators.required],
      email: ['-', Validators.required],
      customerId: ['0', Validators.required],
      customerNum: [''],
      customerType: ['', Validators.required],
      site: ['', Validators.required],
      status: ['', Validators.required],
      company: ['', Validators.required],
      userId: [0],
      fileReq: [''],
      fileCertificate: [''],
      path: [''],
      prefix: [''],
      postId: [0],
      addressDetail: ['']
    });

    await this.handleRouteParams();

    if (this.router.url.includes('/view/')) {
      this.isViewMode = true;
      this.customerForm.disable();
    }

    this.postCodeService.getPostCodes().subscribe(data => {
      this.items_provinces = data;
      this.filteredItemsProvince = data;
    });

    this.prefixService.getPrefix().subscribe(data => {
      this.item_prefix = data;
      this.filteredItemsPrefix = data;
    });

    this.getCustomerType();

    this.customerForm.get('customerType')!.valueChanges.subscribe(value => {
      const customerTypeId = this.getCustomerTypeId(value);

      if (customerTypeId) {
        this.loadCustomerType(customerTypeId);
      }
      if (value === '1F' || value === 'OSEA') {
        this.filteredItemsPrefix = this.item_prefix.filter(prefix => prefix.name === 'อื่นๆ');
        this.customerForm.patchValue({
          prefix: ''
        });
      } else {
        this.filteredItemsPrefix = this.item_prefix;
      }

      this._cdr.detectChanges();
    });

    this.customerForm.get('prefix')?.valueChanges.subscribe((prefix: string) => {
      this.selectedPrefix = prefix;
      this.updateNameWithPrefixChange();
      this._cdr.detectChanges();
    });

    this.customerForm.get('company')?.valueChanges.subscribe(value => {
      this.checkAndCallApi();
    });

    this.checkRole();
    this.getDataCompany();
    this.displayFiles = this.filess && this.filess.length > 0 ? this.filess : this.files;
  }
  private itemsProvincesLoaded = false;
  private async handleRouteParams(): Promise<void> {
    return new Promise((resolve) => {
      this.route.paramMap.subscribe(async (params) => {
        const id = params.get('id');
        if (id) {
          this.customerId = +id;
          const { customerData, postCodes } = await forkJoin({
            customerData: this.customerService.findCustomerById(this.customerId),
            postCodes: this.postCodeService.getPostCodes()
          }).toPromise() as { customerData: ICustomer; postCodes: DataLocation[] };

          this.customerForm.patchValue({
            ...customerData,
            postalCode: customerData.postalCode + '-' + customerData.subdistrict
          });

          this.items_provinces = postCodes;
          this.filteredItemsProvince = postCodes;
          this.itemsProvincesLoaded = true;

          if (this.customerForm.value.postalCode && this.customerForm.value.postId) {
            const merge = this.customerForm.value.postalCode;
            this.onPostalCodeChange(merge);
          }

          this.loadCustomerData(this.customerId);
          resolve();

        } else {
          resolve();
        }
      });
    });
  }

  onNameBlur(): void {
    const nameControl = this.customerForm.get('name');
    let nameValue = nameControl?.value || '';

    if (!nameValue) {
      return;
    }

    nameValue = nameValue.replace(/^บริษัท /, '')
      .replace(/\s?จำกัด\s?\(มหาชน\)/g, '')
      .replace(/\s?จำกัด/g, '')
      .replace(/^คุณ /, '')
      .replace(/^ห้างหุ้นส่วนสามัญ/, '')
      .replace(/^ห้างหุ้นส่วนจำกัด/, '');

    if (this.selectedPrefix === 'บริษัทจำกัด') {
      nameControl?.setValue(`บริษัท ${nameValue.trim()} จำกัด`);
    } else if (this.selectedPrefix === 'บริษัทจำกัด (มหาชน)') {
      nameControl?.setValue(`บริษัท ${nameValue.trim()} จำกัด (มหาชน)`);
    } else if (this.selectedPrefix === 'คุณ') {
      nameControl?.setValue(`คุณ ${nameValue.trim()}`);
    } else if (this.selectedPrefix === 'ห้างหุ้นส่วนสามัญ') {
      nameControl?.setValue(`ห้างหุ้นส่วนสามัญ${nameValue.trim()}`);
    } else if (this.selectedPrefix === 'ห้างหุ้นส่วนจำกัด') {
      nameControl?.setValue(`ห้างหุ้นส่วนจำกัด${nameValue.trim()}`);
    } else {
      nameControl?.setValue(nameValue.trim());
    }
    this.checkAndCallApi();
  }

  onSiteBlur(): void {
    const nameControl = this.customerForm.get('site');
    let siteValue = nameControl?.value || '';

    if (!siteValue) {
      return;
    }

    if (siteValue.length !== 5) {
      Swal.fire({
        icon: 'error',
        title: 'Site ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Site ของคุณมี 5 หลักหรือไม่',
        confirmButtonText: 'ปิด'
      });
      return;
    }

    this.checkAndCallApi();
  }

  updateNameWithPrefixChange(): void {
    const nameControl = this.customerForm.get('name');
    let nameValue = nameControl?.value || '';

    if (!nameValue) {
      return;
    }

    nameValue = nameValue.replace(/^บริษัท /, '')
      .replace(/ จำกัด \(มหาชน\)$/, '')
      .replace(/ จำกัด$/, '')
      .replace(/^คุณ /, '')
      .replace(/^ห้างหุ้นส่วนสามัญ/, '')
      .replace(/^ห้างหุ้นส่วนจำกัด/, '');

    if (this.selectedPrefix === 'บริษัทจำกัด') {
      nameControl?.setValue(`บริษัท ${nameValue} จำกัด`);
    } else if (this.selectedPrefix === 'บริษัทจำกัด (มหาชน)') {
      nameControl?.setValue(`บริษัท ${nameValue} จำกัด (มหาชน)`);
    } else if (this.selectedPrefix === 'คุณ') {
      nameControl?.setValue(`คุณ ${nameValue}`);
    } else if (this.selectedPrefix === 'ห้างหุ้นส่วนสามัญ') {
      nameControl?.setValue(`ห้างหุ้นส่วนสามัญ${nameValue}`);
    } else if (this.selectedPrefix === 'ห้างหุ้นส่วนจำกัด') {
      nameControl?.setValue(`ห้างหุ้นส่วนจำกัด${nameValue}`);
    } else {
      nameControl?.setValue(nameValue);
    }
  }

  validateTaxId(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTaxId(input);
    this.customerForm.patchValue({ taxId: numericValue });
    event.target.value = numericValue;
  }

  onTaxIdBlur(): void {
    const numericValue = this.customerForm.value.taxId
    if (numericValue.length < 13) {
      Swal.fire('แจ้งเตือน!', 'เลข Tax ID ไม่ครบ 13 หลัก ขอให้คุณตรวจสอบ แต่หากถูกต้องแล้ว ดำเนินการกรอกช่องอื่นได้เลย', 'warning');
    }
  }

  validateTel(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTel(input);
    event.target.value = numericValue;
    this.customerForm.patchValue({ tel: numericValue });
  }

  validateSite(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateSite(input);
    event.target.value = numericValue;
    this.customerForm.patchValue({ site: numericValue });
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isApprovedFN = user.action.includes('approvedFN');
        this.isUser = user.action.includes('user');
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
      this.originalData = { ...data };
      this.idreq = data.userId
      this.filess = [
        { fileName: 'ใบขอเปิด Customer', fileType: 'fileReq', filePath: this.customerForm.value.fileReq || '' },
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'fileCertificate', filePath: this.customerForm.value.fileCertificate || '' }
      ];
      this.displayFiles = this.filess

      this.getEventLogs(id)
    });
  }

  loadCustomerType(id: number): void {
    this.customerService.findCustomerTypeById(id).pipe(debounceTime(300), distinctUntilChanged()).subscribe((data: any) => {
      const customerNumPrefix = data.codeFrom;
      this.typeCode = customerNumPrefix;
      if (customerNumPrefix === '1F') {
        this.customerForm.patchValue({
          customerNum: '',
          postalCode: '-',
          province: '-',
          district: '-',
          subdistrict: '-',
          site: '',
          postId: 0
        });
      }
    });
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
    if (!this.itemsProvincesLoaded || !this.items_provinces || this.items_provinces.length === 0) {
      console.warn('Items provinces are not loaded yet. Skipping onPostalCodeChange.');
      return;
    }
    let selectedItemId: any;
    let selectedItem: any;
    const [postalCode, subdistrict] = value.split('-');
    const potalCodeold = this.customerForm.value.postalCode
    const postId = this.customerForm.value.postId
    const district = this.customerForm.value.district
    const province = this.customerForm.value.province

    selectedItem = this.items_provinces.find(item => item.postalCode === postalCode && item.subdistrict === subdistrict);
    console.log(selectedItem);
    
    if (potalCodeold === '' || potalCodeold == undefined) {
      selectedItem = this.items_provinces.find(item => item.postalCode === postalCode && item.subdistrict === subdistrict);
    }
    if (selectedItem == null || selectedItem == undefined) {
      selectedItemId = this.items_provinces.find(item => item.postalCode === postalCode && item.postId === postId);
    }
    if (selectedItemId) {
      selectedItemId.subdistrict = subdistrict;
      selectedItemId.district = district;
      selectedItemId.province = province;
      this.filteredItemsProvince = [...this.items_provinces];

      this.customerForm.patchValue({
        postalCode: selectedItemId.postalCode + '-' + selectedItemId.subdistrict
      });
    }
    else if (selectedItem) {
      this.customerForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province,
        postId: selectedItem.postId
      });
      this.cdr.markForCheck();
    }
  }

  isSubdistrictMatching(item: DataLocation): boolean {
    const currentSubdistrict = this.customerForm.get('subdistrict')?.value;
    return item.subdistrict === currentSubdistrict;
  }

  isdistrictMatching(item: DataLocation): boolean {
    const currentdistrict = this.customerForm.get('district')?.value;
    return item.district === currentdistrict;
  }

  async onSubmit(): Promise<void> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (this.isViewMode) {
      this.customerForm.enable();
    }

    if (this.customerForm.valid) {
      const formValue = this.prepareFormData();

      if (this.customerId) {
        await this.onUpdate();
      } else {
        this.customerService.addData(formValue).subscribe({
          next: async (response) => {
            this.customerForm.patchValue({ customerId: response.customer_id });
            this.customerId = response.customer_id
            if (this.listfile.length !== 0) {
              await this.UploadFile();
            }
            this.insertLog();
            Swal.fire({
              icon: 'success',
              title: 'Saved!',
              text: 'Your data has been saved.',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.router.navigate(['/feature/customer']);
            });
          },
          error: (err) => {
            console.error('Error adding data', err);
          }
        });
      }
    } else {
      this.customerForm.markAllAsTouched();

      if (this.emailError !== '') {
        Swal.fire({
          icon: 'warning',
          title: 'Email ไม่ถูกต้อง',
          text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
          confirmButtonText: 'ปิด'
        });
      } else {
        Swal.fire('warning!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      }
    }
  }

  async onUpdate(): Promise<void> {
    try {
      if (this.listfile.length !== 0) {
        await this.UploadFile();
      }

      const formValue = this.prepareFormData();

      await this.customerService.updateData(this.customerId!, formValue).toPromise();

      this.insertLog();

    } catch (error) {
      console.error('Error during update process:', error);
    }
  }

  prepareFormData(): any {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    const formValue = { ...this.customerForm.value };
    console.log(this.customerForm.value);
    const postalCode = formValue.postalCode.split('-')[0];

    formValue.postalCode = postalCode;
    
    if (this.listDataByTaxId) {
      formValue.id = 0
    }
    else if (!this.customerId) {
      delete formValue.id;
    }
    formValue.userId = currentUser.userId;
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
      }
    });
  }

  insertLog(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (this.customerForm.valid) {
      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 7);
      const log = {
        Id: 0,
        UserId: currentUser.userId || 0,
        Username: currentUser.username || 'string',
        Email: currentUser.email || 'string',
        Status: this.customerForm.get('status')?.value || 'Draft',
        CustomerId: this.customerId || 0,
        SupplierId: 0,
        Time: currentDate,
        RejectReason: this.reasonTemp
      };
      this.customerService.insertLog(log).subscribe({
        next: (response) => {
        },
        error: (err) => {
          console.error('Error adding log data', err);
        }
      });
    } else {
      console.error('Supplier form or supplier bank form is not valid');
    }
  }

  getEventLogs(customerId: number): void {
    this.customerService.getLog(customerId).subscribe(
      (data) => {
        this.logs = data.map(log => {
          return {
            ...log,
            time: this.formatDateTime(log.time)
          };
        });
      },
      (error) => {
        console.error('Error fetching logs', error);
      }
    );
  }

  validateEmail() {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,4}){1,2}$/;
    if (!this.customerForm.value.email) {
      this.emailError = 'Email is required';
    } else if (!emailPattern.test(this.customerForm.value.email)) {
      if (this.customerForm.value.email === '-') {
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
    event.preventDefault();
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to save?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Save it!'
    });

    if (result.isConfirmed) {
      const status = this.customerForm.value.status
      if (status === 'Pending Approved By ACC') {
        await this.setStatusAndSubmit(status);
      }
      else {
        await this.setStatusAndSubmit('Draft');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Your data has been updated.',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        this.router.navigate(['/feature/customer']);
      });
    }
  }

  checkSave(event: Event) {
    this.validateEmail();
    if (this.emailError && this.emailError.trim() !== '') {
      Swal.fire({
        icon: 'warning',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
      return;
    }

    if (!this.isFormValidWithoutCustomerNum()) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        confirmButtonText: 'ปิด'
      });
      return;
    }
    else {
      this.save(event);
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
          const currentStatus = this.customerForm.get('status')?.value;
          this.setStatusAndSubmit("Pending Approved By ACC");
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Your data has been updated.',
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            this.router.navigate(['/feature/customer']);
          });
        }
      }
    });
  }

  async approve(event: Event): Promise<void> {
    event.preventDefault();
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to Approve?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      await this.setStatusAndSubmit("Approved By ACC");
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Your data has been updated.',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        this.router.navigate(['/feature/customer']);
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      this.customerForm.patchValue({ customerNum: '' });
      Swal.fire({
        icon: 'info',
        title: 'Cancelled',
        text: 'Your customer number has been cleared.',
        showConfirmButton: false,
        timer: 1500
      });
    }
  }

  reject(event: Event): void {
    event.preventDefault();
    this.showRejectPopup().then((rejectReason) => {
      if (rejectReason !== undefined) {
        Swal.fire({
          title: 'Are you sure?',
          text: "Do you want to Reject?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, save it!'
        }).then((result) => {
          if (result.isConfirmed) {
            this.reasonTemp = rejectReason;
            this.setStatusAndSubmit("Reject By ACC");
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your data has been updated.',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              this.router.navigate(['/feature/customer']);
            });
          }
        });
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
    this.customerForm.patchValue({ status });

    if (!this.customerId) {
      this.customerForm.patchValue({ customerNum: this.newCusnum });
    }

    await this.onSubmit();
  }

  getTaxIdData(): void {
    const taxId = this.customerForm.get('taxId')?.value;

    if (taxId) {
      this.customerService.getDataByTaxId(taxId).subscribe({
        next: (dataList: any[]) => {
          if (dataList.length > 0) {
            this.listDataByTaxId = dataList

            const latestData = dataList.reduce((prev, current) => (prev.id > current.id) ? prev : current);

            const postalCodeCombination = latestData.postalCode + '-' + latestData.subdistrict;
            this.customerForm.patchValue({
              ...latestData,
              postalCode: postalCodeCombination,
              status: ''
            });
            this.originalData = { ...latestData };
          } else {
          }
        },
        error: (err) => {
          console.error('Error fetching data by Tax ID', err);
        }
      });
    }
  }

  sendEmailNotification(): void {
    if (this.customerForm.get('status')?.value === 'Pending Approved By ACC' && this.customerForm.valid) {
      const company = this.customerForm.get('company')?.value;
      const customerNum = this.customerForm.get('customerNum')?.value;
      this.customerService.findApproversByCompany(company).subscribe(
        (approvers) => {
          approvers.forEach((approver: any) => {
            const to = approver.email;
            const subject = 'OnePortal Notification';
            const body = `
            <p>สถานะของ Customer Number:${customerNum}</p>
            <br>
            <p>ได้เปลี่ยนเป็น ${this.customerForm.get('status')?.value} บกวนเข้ามาดำเนินการตรวจสอบและ Approve ในลำดับต่อไป</p>
            <br>
            <p>ขอแสดงความนับถือ</p>
            <p>OnePortal</p>
            <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;

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

  isDataUnchanged(existingData: any, newData: any): boolean {
    const fieldsToCompare = ['name', 'tax_Id', 'address_sup', 'district', 'subdistrict', 'province', 'tel', 'email', 'customerNum', 'customerType', 'site'];

    const existingPostalCode = existingData.postalCode.split('-')[0];
    const newPostalCode = newData.postalCode.split('-')[0];

    for (const field of fieldsToCompare) {

      if (existingData[field] !== newData[field]) {
        return false;
      }
    }
    if (existingPostalCode !== newPostalCode) {
      return false;
    }
    return true;
  }

  compareWithExistingData(existingDataList: any[], newData: any): boolean {
    for (let existingData of existingDataList) {
      if (this.isDataUnchanged(existingData, newData)) {
        return true;
      }
    }
    return false;
  }

  backClicked(event: Event): void {
    event.preventDefault();
    this._location.back();
  }

  onCustomerTypeChange(value: string): void {
    this.selectType = value;
  }

  isOverseaCustomer(): boolean {
    return this.selectType === 'OSEA';
  }


  isFormValidWithoutCustomerNum(): boolean {
    const requiredFields = [
      'name', 'taxId', 'addressSup', 'district', 'subdistrict',
      'province', 'postalCode', 'tel', 'email', 'customerType',
      'site', 'company'
    ];

    for (const field of requiredFields) {
      if (!this.customerForm.get(field)?.value) {
        return false;
      }
    }

    return true;
  }

  onFileSelected(event: Event, file: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {

      const selectedFile = input.files[0];

      if (file.fileName === 'ใบขอเปิด Customer') {
        this.customerForm.patchValue({ fileReq: selectedFile.name });
      } else if (file.fileName === 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน') {
        this.customerForm.patchValue({ fileCertificate: selectedFile.name });
      }

      file.filePath = selectedFile.name;
    }
  }

  UploadFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.listfile.forEach((file) => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        this.customerService.uploadFile(formData).subscribe({
          next: (response: any) => {
            this.uploadedFiles.push(response);
            this.customerForm.patchValue({ path: response.filePath });
            resolve();
          },
          error: (err) => {
            console.error('Error uploading file:', err);
            reject(err);
          }
        });
      });
      this.listfile = [];
    });
  }

  getDownloadUrl(fileName: string): string {
    return `${environment.uploads_url}/${fileName}`;
  }


  extractFileName(filePath: string): string {
    return filePath.split('/').pop() || '';
  }

  removeFile(file: any): void {
    file.filePath = '';
  }

  sendEmailNotificationRequester(): void {
    const customerNum = this.customerForm.get('customerNum')?.value;
    this.userService.findUserById(this.idreq).subscribe((data: any) => {
      this.emailreq = data.email
      this._cdr.markForCheck();
    });

    const to = this.emailreq;
    const subject = 'OnePortal Notification';
    const body = `
        <p>สถานะของ Customer Number:${customerNum}</p>
        <br>
        <p>ได้เปลี่ยนเป็น ${this.customerForm.get('status')?.value} สามารถเข้ามาตรวจสอบได้ในระบบ</p>
        <br>
        <p>ขอแสดงความนับถือ</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;

    this.emailService.sendEmail(to, subject, body).subscribe(
      (response) => {
      },
      (error) => {
        console.error('Error sending email', error);
      }
    );
  }

  async checkApprove(event: Event): Promise<void> {
    try {
      await this.approve(event);
    } catch (error) {
      console.error('Error occurred during approval:', error);
    }
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
        this.listOfCompany = response;
        this.filteredDataompany = response;
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  checkAndCallApi(): void {
    const company = this.customerForm.get('company')?.value;
    const site = this.customerForm.get('site')?.value;
    const name = this.customerForm.get('name')?.value;
    const userId = this.customerForm.get('id')?.value;

    if ((company && site && name) && userId == 0) {
      this.callApiWitCompanySiteAndName(company, site, name);
    }
  }

  callApiWitCompanySiteAndName(company: string, site: string, name: string): void {
    const formData = {
      Company: company,
      Site: site,
      Name: name
    };

    this.customerService.CheckDuplicateSCustomerByConpanySiteAndName(formData).subscribe({
      next: (response: string) => {
        if (response.includes('No duplicate Customer found.')) {
        }
      },
      error: (err) => {
        console.error('Error occurred:', err);
        Swal.fire({
          icon: 'warning',
          title: 'ข้อมูลซ้ำ',
          text: err,
          confirmButtonText: 'ปิด'
        });
        this.customerForm.patchValue({ company: '' });
      }
    });
  }

  getMaxCustomerNum(): void {
    this.customerService.GetMaxCustomerNum().subscribe({
      next: (response: any) => {
      },
      error: () => {
      }
    });
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มจาก 0 ต้องบวกเพิ่ม 1
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}