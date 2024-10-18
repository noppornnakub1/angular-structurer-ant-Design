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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { prefixService } from '../../../../shared/constants/prefix.service';
import { ValidationService } from '../../../../shared/constants/ValidationService';
import { UserService } from '../../../user-manager/services/user.service';
import { SupplierService } from '../../../supplier/services/supplier.service';


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
    { fileName: 'ใบขอเปิด Customer', status: null, filePath: '' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', status: null, filePath: '' },
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
      customerId: ['0', Validators.required],
      customerNum: ['',],
      customerType: ['', Validators.required],
      site: ['', Validators.required],
      status: ['', Validators.required],
      company: ['', Validators.required],
      userId: [0],
      fileReq: [''],
      fileCertificate: [''],
      path: [''],
      prefix: ['']
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
    this.getDataCompany()
    this.displayFiles = this.filess && this.filess.length > 0 ? this.filess : this.files;
    console.log('displayFiles:', this.displayFiles);
  }

  onNameBlur(): void {
    const nameControl = this.customerForm.get('name');
    let nameValue = nameControl?.value || '';

    if (!nameValue) {
      return;
    }

    // ลบ prefix และ suffix ที่ไม่จำเป็นออกก่อน
    nameValue = nameValue.replace(/^บริษัท /, '')
      .replace(/\s?จำกัด\s?\(มหาชน\)/g, '') // ลบ "จำกัด (มหาชน)" ทั่วทั้งข้อความ
      .replace(/\s?จำกัด/g, '')              // ลบ "จำกัด" ทั่วทั้งข้อความ
      .replace(/^คุณ /, '')
      .replace(/^ห้างหุ้นส่วนสามัญ/, '')
      .replace(/^ห้างหุ้นส่วนจำกัด/, '');

    // ตรวจสอบและเพิ่ม prefix/suffix ตาม selectedPrefix
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
    const numericValue = this.validationService.validateTaxId(input);  // เรียกใช้ฟังก์ชันจาก service
    this.customerForm.patchValue({ taxId: numericValue });
    event.target.value = numericValue;
  }

  validateTel(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTel(input);  // เรียกใช้ฟังก์ชันจาก service
    event.target.value = numericValue;
    this.customerForm.patchValue({ tel: numericValue });
  }

  validateSite(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateSite(input);  // เรียกใช้ฟังก์ชันจาก service
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

  async onSubmit(): Promise<void> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (this.isViewMode) {
      this.customerForm.enable();
    }


    if (this.customerForm.valid) {
      const formValue = this.prepareFormData();

      // ตรวจสอบข้อมูลที่เกี่ยวข้องกับรหัสไปรษณีย์
      const selectedPostItem = this.items_provinces.find(item =>
        item.postalCode === formValue.postalCode &&
        this.isSubdistrictMatching(item)
      );

      if (selectedPostItem) {
        formValue.post_id = selectedPostItem.post_id;
      }

      if (this.customerId) {
        await this.onUpdate();  // รอให้การอัปเดตเสร็จก่อน
      } else {
        this.customerService.addData(formValue).subscribe({
          next: async (response) => {
            console.log(response);
            this.customerForm.patchValue({ customerId: response.customer_id });
            this.customerId = response.customer_id
            if (this.listfile.length !== 0) {
              await this.UploadFile();  // รอให้การอัปโหลดไฟล์เสร็จก่อน
            }
            this.insertLog();

            Swal.fire({
              icon: 'success',
              title: 'Saved!',
              text: 'Your data has been saved.',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              // ทำการ redirect หลังจาก popup ทำงานเสร็จ
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
          icon: 'error',
          title: 'Email ไม่ถูกต้อง',
          text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
          confirmButtonText: 'ปิด'
        });
      } else {
        Swal.fire('Error!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      }
    }
  }

  async onUpdate(): Promise<void> {
    try {
      if (this.listfile.length !== 0) {
        await this.UploadFile();  // รอให้การอัปโหลดไฟล์เสร็จก่อน
      }

      const formValue = this.prepareFormData();
      console.log(formValue);
      delete formValue.post_id;

      // รอให้การ update ข้อมูลเสร็จสมบูรณ์ก่อนทำอย่างอื่น
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
    console.log("470", this.customerId);
    console.log("471", this.customerForm.value);

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
        CustomerId: this.customerId || 0,
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
        const status = this.customerForm.value.status
        if(status === 'Pending Approved By ACC'){
          this.setStatusAndSubmit(status);
        }
        else{
          this.setStatusAndSubmit('Draft');
        }
        // เมื่อทุกอย่างเสร็จแล้ว ค่อยทำการ redirect
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Your data has been updated.',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          // ทำการ redirect หลังจาก popup ปิด
          this.router.navigate(['/feature/customer']);
        });
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

          // เมื่อทุกอย่างเสร็จแล้ว ค่อยทำการ redirect
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Your data has been updated.',
            showConfirmButton: false,
            timer: 1500
          }).then(() => {
            // ทำการ redirect หลังจาก popup ปิด
            this.router.navigate(['/feature/customer']);
          });
        }
      }
    });
  }

  async approve(event: Event): Promise<void> {
    event.preventDefault();

    // ใช้ await เพื่อรอการทำงานของ Swal.fire ให้เสร็จสมบูรณ์
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to Approve?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve it!'
    });

    // ถ้าผู้ใช้กดยืนยัน ให้ทำการอนุมัติ
    if (result.isConfirmed) {
      // รอให้การตั้งค่าสถานะและการ submit เสร็จสิ้นก่อน
      await this.setStatusAndSubmit("Approved By ACC");

      // เมื่อทุกอย่างเสร็จแล้ว ค่อยทำการ redirect
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Your data has been updated.',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        // ทำการ redirect หลังจาก popup ปิด
        this.router.navigate(['/feature/customer']);
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
            // เมื่อทุกอย่างเสร็จแล้ว ค่อยทำการ redirect
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your data has been updated.',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              // ทำการ redirect หลังจาก popup ปิด
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
      console.log("Set customerNum: ", this.customerForm.value);
    }

    // รอให้การ submit ข้อมูลเสร็จก่อน
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

  CheckDupplicateData(): Promise<void> {
    this.isCheckingDuplicate = true;

    return new Promise((resolve, reject) => {
      if (!this.isFormValidWithoutCustomerNum()) {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          text: 'โปรดกรอกข้อมูลในฟอร์มให้ครบทุกช่องที่จำเป็น',
          confirmButtonText: 'ปิด'
        });
        this.isCheckingDuplicate = false;
        return reject('Form is not validxxx');
      }

      const foundItem = this.filteredDataType.find(item => item.code === this.customerForm.value.customerType);
      if (foundItem) {
        this.typeCode = foundItem.codeFrom;
      }

      const tax = this.customerForm.value.taxId.trim();
      const type = this.typeCode.trim();
      const key = `${tax}-${type}`;
      console.log('804', key);
      console.log('805', this.typeCode);

      this.customerService.CheckDupplicateCustomer(key).subscribe({
        next: (response: any) => {
          if (response && response.length > 0) {
            Swal.fire({
              icon: 'error',
              title: 'ข้อมูลซ้ำ',
              text: 'มีข้อมูล Supplier นี้อยู่ในฐานข้อมูลอยู่แล้ว โปรดตรวจสอบ TaxID และ Type อีกครั้ง',
              confirmButtonText: 'ปิด'
            });
            this.isCheckingDuplicate = false;
            reject('Duplicate data found');
          } else {
            this.getNumMaxCustomer().then(() => {
              this.isCheckingDuplicate = false;
              resolve();
            }).catch(err => {
              this.isCheckingDuplicate = false;
              reject(err);
            });
          }
        },
        error: (err) => {
          if (err === 'No data found.') {
            this.getNumMaxCustomer().then(() => {
              this.isCheckingDuplicate = false;
              resolve();
            }).catch(err => {
              this.isCheckingDuplicate = false;
              reject(err);
            });
          } else {
            this.isCheckingDuplicate = false;
            reject(err);
          }
        }
      });
    });
  }

  getNumMaxCustomer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("841", this.typeCode);

      this.customerService.GetNumMaxCustomer(this.typeCode).subscribe({
        next: (response: any) => {
          console.log('850', response);

          if (!response || response.length === 0 || response.num === null) {
            this.customerForm.patchValue({ customerNum: '' });
          } else {
            const max = response.num;
            const maxStr = String(max);
            const matchResult = maxStr.match(/^(\d*[A-Za-z]+)(\d+)$/);
            const prefix = matchResult ? matchResult[1] : '';
            const numPart = matchResult ? matchResult[2] : '0';
            const nextNum = String(parseInt(numPart, 10) + 1).padStart(numPart.length, '0');
            const newCustomerNum = `${prefix}${nextNum}`;
            this.newCusnum = newCustomerNum;
            this.customerForm.patchValue({ customerNum: newCustomerNum });
            console.log(this.customerForm.value);

          }
          this._cdr.markForCheck();
          resolve();
        },
        error: (err) => {
          console.error('Error while fetching max supplier number', err);
          reject(err);
        }
      });
    });
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
      // พี่หนึ่งห้ามลบครับ ขอร้องงง ตรวจสอบชนิดของไฟล์ เอาออก (16/10/2024)
      // const fileType = selectedFile.type;
      // if (fileType !== 'application/pdf') {
      //   Swal.fire({
      //     icon: 'error',
      //     title: 'ชนิดของไฟล์ไม่ถูกต้อง',
      //     text: 'ชนิดของไฟล์ต้องเป็น .PDF เท่านั้น',
      //     confirmButtonText: 'ปิด'
      //   });
      //   input.value = ''; // รีเซ็ต input file
      //   return;
      // }

      // พี่หนึ่งห้ามลบครับ ขอร้องงง ตรวจสอบขนาดของไฟล์ (ขนาดไฟล์จะถูกวัดในหน่วย bytes, 1MB = 1,048,576 bytes) เอาออก (16/10/2024)
      // const maxSizeInMB = 5;
      // const maxSizeInBytes = maxSizeInMB * 1048576; // 5MB in bytes
      // if (selectedFile.size > maxSizeInBytes) {
      //   Swal.fire({
      //     icon: 'error',
      //     title: 'ขนาดของไฟล์ไม่ถูกต้อง',
      //     text: 'ขนาดของไฟล์ต้องไม่เกิน 5 MB ',
      //     confirmButtonText: 'ปิด'
      //   });
      //   input.value = ''; // รีเซ็ต input file
      //   return;
      // }
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

  extractFileName(filePath: string): string {
    return filePath.split('/').pop() || ''; // แยกชื่อไฟล์จาก path
  }

  removeFile(file: any): void {
    file.filePath = '';
    // file.fileName = '';
  }

  sendEmailNotificationRequester(): void {
    const customerNum = this.customerForm.get('customerNum')?.value;
    this.userService.findUserById(this.idreq).subscribe((data: any) => {
      this.emailreq = data.email
      console.log(this.emailreq);
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
      // ตรวจสอบข้อมูลซ้ำให้เสร็จก่อน
      await this.CheckDupplicateData();

      // รอให้ approve() ทำงานเสร็จก่อนดำเนินการต่อ
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

        // if (CheckcurrentUser.company === 'ALL') {
        this.listOfCompany = response;
        this.filteredDataompany = response;
        // } else {
        //   this.listOfCompany = response.filter((company: DataCompany) => userCompanies.includes(company.abbreviation));
        //   this.filteredDataompany = this.listOfCompany;
        // }
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }
}