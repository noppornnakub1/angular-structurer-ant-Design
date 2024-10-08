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
import { DataLocation, prefix } from '../../../supplier/pages/supplier-add/supplier-add.component';
import Swal from 'sweetalert2';
import { EmailService } from '../../../../shared/constants/email.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { prefixService } from '../../../../shared/constants/prefix.service';


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
  private readonly _router = inject(Router);
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
    { fileName: 'ใบขอเปิด Customer', status: null,filePath: '' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', status: null,filePath: '' },
  ];
  file: any;
  filess: Array<{ fileName: string; fileType: string; filePath: string }> = [];
  displayFiles: Array<{ fileName: string; filePath: string }> = [];
  listfile: File[] = [];
  uploadedFiles: any[] = [];
  constructor(private _location: Location, private fb: FormBuilder
    , private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef,
    private emailService: EmailService,
    private prefixService: prefixService
  ) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      id: [0],
      name: ['', Validators.required],
      taxId: ['', Validators.required],
      addressSup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      customer_id: ['0', Validators.required],
      customerNum: ['', Validators.required],
      customerType: ['', Validators.required],
      site: ['', Validators.required],
      status: ['', Validators.required],
      company: ['', Validators.required],
      userId: [0],
      fileReq: [''],
      fileCertificate: [''],
      path: [''],
      prefix:['']
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
    });
    this.customerForm.get('prefix')?.valueChanges.subscribe((prefix: string) => {
      this.selectedPrefix = prefix;
      this.updateNameWithPrefixChange();
      this._cdr.detectChanges();
    });
    this.checkRole();
    this.displayFiles = this.filess && this.filess.length > 0 ? this.filess : this.files;
    console.log('displayFiles:', this.displayFiles);
  }

  onNameBlur(): void {
    const nameControl = this.customerForm.get('name');
    let nameValue = nameControl?.value || '';
  
    if (!nameValue) {
      return;
    }
  
    // ลบ prefix และ suffix ที่ไม่ต้องการออกก่อน
    nameValue = nameValue.replace(/^บริษัท /, '')
      .replace(/ จำกัด \(มหาชน\)$/, '')
      .replace(/ จำกัด$/, '')
      .replace(/^คุณ /, '')
      .replace(/^ห้างหุ้นส่วนสามัญ/, '')
      .replace(/^ห้างหุ้นส่วนจำกัด/, '');
  
    // กำหนดเงื่อนไขตาม selectedPrefix
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
      // ถ้าเลือกเป็น "อื่นๆ" ให้แสดงแค่ nameValue
      nameControl?.setValue(nameValue);
    }
  }
  
  updateNameWithPrefixChange(): void {
    const nameControl = this.customerForm.get('name');
    let nameValue = nameControl?.value || '';
  
    if (!nameValue) {
      return;
    }
  
    // ลบ prefix และ suffix ที่ไม่ต้องการออกก่อน
    nameValue = nameValue.replace(/^บริษัท /, '')
      .replace(/ จำกัด \(มหาชน\)$/, '')
      .replace(/ จำกัด$/, '')
      .replace(/^คุณ /, '')
      .replace(/^ห้างหุ้นส่วนสามัญ/, '')
      .replace(/^ห้างหุ้นส่วนจำกัด/, '');
  
    // กำหนดเงื่อนไขการเพิ่ม prefix และ suffix
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
      // ถ้าเลือกเป็น "อื่นๆ" ให้แสดงแค่ nameValue
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

    this.customerForm.patchValue({ taxId: numericValue });
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

    this.customerForm.patchValue({ tel: event.target.value });
  }

  validateSite(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
    const numericValue = input.replace(/\D/g, '');

    // อัปเดตค่าใน form control
    this.customerForm.patchValue({ site: numericValue });
    event.target.value = numericValue;
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
      console.log(this.originalData);
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
      const customerNumPrefix = data.code_from;
      this.typeCode = customerNumPrefix;
      if (customerNumPrefix === '1F') {
        this.customerForm.patchValue({
          customerNum: '-',
          postalCode: '-',
          province: '-',
          district: '-',
          subdistrict: '-',
          site: ''
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log(currentUser);

    if (this.isViewMode) {
      this.customerForm.enable();
    }

    this.isSubmitting = true;
    if (!this.customerId) {
      this.customerForm.patchValue({ company: currentUser.company });
      console.log("!this.customerId");
    }
    this.CheckDupplicateData();
    console.log(this.customerForm.valid, this.customerForm.value);

    if (this.customerForm.valid) {
      const formValue = this.prepareFormData();
      const selectedPostItem = this.items_provinces.find(item => item.postalCode === formValue.postalCode && this.isSubdistrictMatching(item));
      if (selectedPostItem) {
        formValue.post_id = selectedPostItem.post_id;
      }
      console.log(selectedPostItem, formValue);
      this.tempCusForm = formValue;
      if (this.customerId) {
        this.onUpdate();
      } else {
        this.customerService.addData(formValue).subscribe({
          next: (response) => {
            this.customerForm.patchValue({ customer_id: response.customer_id });
            this.UploadFile()
            this.insertLog();
            Swal.fire({
              icon: 'success',
              title: 'Saved!',
              text: 'Your data has been saved.',
              showConfirmButton: false,
              timer: 1500
            });
            this.router.navigate(['/feature/customer']);
          },
          error: (err) => {
            console.error('Error adding data', err);
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.customerForm.markAllAsTouched();
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
        Swal.fire('Error!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      }
      this.isSubmitting = false;
    }
  }

  async onUpdate(): Promise<void> {
    try {
      await this.UploadFile();
      const formValue = this.prepareFormData();
      console.log('Form value before update:', formValue);
      this.customerService.updateData(this.customerId!, formValue).subscribe({
        next: (response) => {
          console.log('Update response:', response);
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
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
    const selectedPostItem = this.items_provinces.find(item => {
      const postalCode = formValue.postalCode.split('-')[0];
      return item.postalCode === postalCode && this.isSubdistrictMatching(item);
    });

    if (selectedPostItem) {
      formValue.postalCode = selectedPostItem.postalCode;
      formValue.post_id = selectedPostItem.post_id;
    }
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
        console.log(this.listOfType);

        this.filteredDataType = response;
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  insertLog(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const customerId = this.customerForm.get('customer_id')?.value || this.customerId || 0;
    delete this.tempCusForm.post_id;
    this.customerForm.setValue(this.tempCusForm);
    console.log(this.customerForm);

    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }
    if (this.customerForm.valid) {
      const log = {
        Id: 0,
        UserId: currentUser.userId || 0,
        Username: currentUser.username || 'string',
        Email: currentUser.email || 'string',
        Status: this.customerForm.get('status')?.value || 'Draft',
        CustomerId: customerId,
        SupplierId: 0,
        Time: new Date().toISOString(),
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
        this.logs = data;
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

  save(event: Event): void {
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

  checkSave(event: Event) {
    this.validateEmail();
    if (this.emailError && this.emailError.trim() !== '') {
      console.log('Swal should be fired');
      Swal.fire({
        icon: 'error',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
      return;
    }
    else {
      this.CheckDupplicateData();
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
      text: "Do you want to Approve?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const currentStatus = this.customerForm.get('status')?.value;
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
          text: "Do you want to Reject?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, save it!'
        }).then((result) => {
          if (result.isConfirmed) {
            const currentStatus = this.customerForm.get('status')?.value;
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

  setStatusAndSubmit(status: string): void {
    this.customerForm.patchValue({ status });
    if (!this.customerId) {
      this.customerForm.patchValue({ customerNum: this.newCusnum });
      console.log("625", this.customerForm.value);
    }
    this.onSubmit();
  }

  getTaxIdData(): void {
    const taxId = this.customerForm.get('tax_Id')?.value;

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
            const subject = 'Approval Notification';
            const body = `สถานะของ Customer Number:${customerNum} 
            ได้เปลี่ยนเป็น ${this.customerForm.get('status')?.value} 
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

  CheckDupplicateData() {
    if (this.customerForm.value.customerNum === '') {
      const name = this.customerForm.value.name.trim();
      const site = this.customerForm.value.site.trim();
      const isEnglish = /^[A-Za-z\s]+$/.test(name);
      const cleanedName = isEnglish ? name.replace(/\s+/g, '').toUpperCase() : name.replace(/\s+/g, '');
      const key = site + cleanedName;

      console.log("Generated key for CheckDupplicateCustomer:", key);

      this.customerService.CheckDupplicateCustomer(key).subscribe({
        next: (response: any) => {
          console.log("Response from CheckDupplicateCustomer:", response);

          if (response && response.length > 0) {
            Swal.fire({
              icon: 'error',
              title: 'ข้อมูลซ้ำ',
              text: 'มีข้อมูล Customer นี้อยู่ในฐานข้อมูลอยู่แล้ว โปรดตรวจสอบ Name และ Site อีกครั้ง',
              confirmButtonText: 'ปิด'
            });
            return;
          }
        },
        error: (err) => {
          if (err === 'No data found.') {
            console.log("ไม่พบข้อมูลซ้ำ, ดำเนินการหาข้อมูลเลขล่าสุด...");
            this.customerService.GetNumMaxCustomer(this.typeCode).subscribe({
              next: (response: any) => {
                console.log("Response from GetNumMaxCustomer:", response);

                if (!response || response.length === 0 || response[0]["MAX(NUM)"] === null) {
                  this.customerForm.patchValue({ customerNum: '' });
                  console.log("No customers found, setting customer_num to empty.");
                } else {
                  const max = response[0]["MAX(NUM)"];
                  const maxStr = String(max);
                  console.log("Max Customer Num String:", maxStr);
                  const matchResult = maxStr.match(/^(\d*[A-Za-z]+)(\d+)$/);
                  const prefix = matchResult ? matchResult[1] : '';
                  const numPart = matchResult ? matchResult[2] : '0';
                  console.log("Prefix:", prefix);
                  console.log("NumPart:", numPart);
                  const nextNum = String(parseInt(numPart, 10) + 1).padStart(numPart.length, '0');
                  console.log("Next Num after increment:", nextNum);
                  const newCustomerNum = `${prefix}${nextNum}`;
                  this.newCusnum = newCustomerNum;
                  this.customerForm.setValue({ ...this.customerForm.value, customerNum: newCustomerNum });
                  console.log("New Customer Num:", newCustomerNum);
                  console.log("New Customer Num:", this.customerForm.value);
                  this._cdr.markForCheck();
                }
                this._cdr.markForCheck();
              },
              error: (err) => {
                console.error('Error while fetching max customer number', err);
              }
            });
          } else {
            console.error("Error occurred during CheckDupplicateCustomer:", err);
          }
        }
      });
    }
  }

  onFileSelected(event: Event, file: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];
      // ตรวจสอบชนิดของไฟล์
      const fileType = selectedFile.type;
      if (fileType !== 'application/pdf') {
        Swal.fire({
          icon: 'error',
          title: 'ชนิดของไฟล์ไม่ถูกต้อง',
          text: 'ชนิดของไฟล์ต้องเป็น .PDF เท่านั้น',
          confirmButtonText: 'ปิด'
        });
        input.value = ''; // รีเซ็ต input file
        return;
      }

      // ตรวจสอบขนาดของไฟล์ (ขนาดไฟล์จะถูกวัดในหน่วย bytes, 1MB = 1,048,576 bytes)
      const maxSizeInMB = 5;
      const maxSizeInBytes = maxSizeInMB * 1048576; // 5MB in bytes
      if (selectedFile.size > maxSizeInBytes) {
        Swal.fire({
          icon: 'error',
          title: 'ขนาดของไฟล์ไม่ถูกต้อง',
          text: 'ขนาดของไฟล์ต้องไม่เกิน 5 MB ',
          confirmButtonText: 'ปิด'
        });
        input.value = ''; // รีเซ็ต input file
        return;
      }
      // ถ้าไฟล์ผ่านการตรวจสอบทั้งชนิดและขนาด
      this.listfile.push(selectedFile);
      console.log('Selected file:', this.listfile);
      if (this.listfile.length > 0) {
        this.customerForm.patchValue({ fileReq: this.listfile[0].name });
      }
      
      if (this.listfile.length > 1) {
        this.customerForm.patchValue({ fileCertificate: this.listfile[1].name });
      }
    }
    // if (input.files && input.files.length > 0) {
    //   const selectedFile = input.files[0];
    //   this.listfile.push(selectedFile);
    //   console.log('Selected file:', selectedFile.name);

    //   if (fileKey === 'file_req') {
    //     this.customerForm.patchValue({ fileReq: selectedFile.name });
    //   } else if (fileKey === 'file_certificate') {
    //     this.customerForm.patchValue({ fileCertificate: selectedFile.name });
    //   }

    //   console.log('Updated customerForm:', this.customerForm.value);
    // }
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
    // baseURL ควรชี้ไปยัง root ของเซิร์ฟเวอร์และโฟลเดอร์ 'uploads'
    // const baseURL = 'http://localhost:7126/uploads';
    const baseURL = 'http://10.10.0.28:8088/uploads';
    return `${baseURL}/${fileName}`;
  }
}