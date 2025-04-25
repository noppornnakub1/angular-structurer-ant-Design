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
import { LogDownloadSerive } from '../../../../shared/constants/logDownload.service';
import { degrees, PDFDocument, rgb } from 'pdf-lib';
import { ModalDataService } from '../../../dashboard/services/modal-data.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PdfViewerComponent } from '../../../dashboard/pages/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-customer-add',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule, HttpClientModule],
  // providers: [PostCodeService],
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
  tel: number | null = null;
  files = [
    { fileName: 'ใบขอเปิด Customer', fileType: 'fileReq', filePath: '' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'fileCertificate', filePath: '' },
    { fileName: 'ภพ.20', fileType: 'FileCertificateATR', filePath: '' },
    { fileName: 'อื่น ๆ', fileType: 'FileOrther', filePath: '' },
  ];
  file: any;
  filess: Array<{ fileName: string; fileType: string; filePath: string }> = [];
  displayFiles: Array<{ fileName: string; filePath: string }> = [];
  listfile: File[] = [];
  uploadedFiles: any[] = [];
  idreq: number = 0;
  emailreq: string = '';
  userData: any;
  isCheckingDuplicate: boolean = false;
  listOfCompany: DataCompany[] = [];
  filteredDataompany: DataCompany[] = [];
  statusforUpdate: string = '';
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
    private modalDataService: ModalDataService,
    private modal: NzModalService,
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
      tel: ['', Validators.required],
      email: ['', Validators.required],
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
      addressDetail: [''],
      lineId: [''],
      fileCertificateATR: [''],
      fileOrther: [''],
      isAddressOld: ['New'],
      country: ['THAILAND']
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
      if (this.customerId == null || 0) {
        if (value === '1F' || value === 'OSEA') {
          this.filteredItemsPrefix = this.item_prefix.filter(prefix => prefix.name === 'อื่นๆ');
          this.customerForm.patchValue({
            prefix: ''
          });
          setTimeout(() => {
            this.sanitizeInput('name');
            this.sanitizeInput('addressSup');
            this.sanitizeInput('addressDetail');
            this.sanitizeInput('lineId');
          }, 0);
        } else {
          this.filteredItemsPrefix = this.item_prefix;
        }
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
        this.route.queryParamMap.subscribe(params => {
          this.statusforUpdate = params.get('status') ?? '';
        });
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
    // ถ้า prefix เป็น "อื่นๆ" ข้ามขั้นตอนการ replace และตั้งค่า nameValue เดิม
    if (this.selectedPrefix === 'อื่นๆ') {
      nameControl?.setValue(nameValue.trim());
      this.checkAndCallApi();
      return;
    }
    else {
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
      }
      else {
        nameControl?.setValue(nameValue.trim());
      }
      this.checkAndCallApi();
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

    this.checkAndCallApi();
  }

  updateNameWithPrefixChange(): void {
    const nameControl = this.customerForm.get('name');
    let nameValue = nameControl?.value || '';

    if (!nameValue) {
      return;
    }
    // ถ้า prefix เป็น "อื่นๆ" ข้ามขั้นตอนการ replace และตั้งค่า nameValue เดิม
    if (this.selectedPrefix === 'อื่นๆ') {
      nameControl?.setValue(nameValue.trim());
      this.checkAndCallApi();
      return;
    }
    else {
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

  }

  validateTaxId(event: any): void {
    const input = event.target.value;
    const type = this.customerForm.value.customerType || '';
    if (/\s/.test(input)) {
      Swal.fire({
        icon: 'warning',
        title: 'warning',
        text: 'กรุณากรอกเลข Tax ID เป็นเลขติดกันเท่านั้น',
        confirmButtonText: 'ตกลง'
      });

      const cleanedInput = input.replace(/\s/g, '');
      event.target.value = cleanedInput;
    }
    var numericValue
    if (this.customerForm.value.customerType === '1F' || this.customerForm.value.customerType === 'OSEA') {
      var numericValue = input
    }
    else {
      numericValue = this.validationService.validateTaxId(input, type);
    }

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

  onblurTel() {
    if (this.customerForm.value.tel != '-' && this.customerForm.value.tel.length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'warning',
        text: 'หมายเลขโทรศัพท์ต้องมี 10 หลัก',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
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
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'fileCertificate', filePath: this.customerForm.value.fileCertificate || '' },
        { fileName: 'ภพ.20', fileType: 'FileCertificateATR', filePath: this.customerForm.value.fileCertificateATR || '' },
        { fileName: 'อื่น ๆ', fileType: 'FileOrther', filePath: this.customerForm.value.fileOrther || '' }
      ];
      this.displayFiles = this.filess

      this.getTelACC();
      this.getEventLogs(id)
    });
  }

  loadCustomerType(id: number): void {
    this.customerService.findCustomerTypeById(id).pipe(debounceTime(300), distinctUntilChanged()).subscribe((data: any) => {
      const customerNumPrefix = data.codeFrom;
      this.typeCode = customerNumPrefix;
      if (this.customerId == null || 0) {
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
    if (!this.items_provinces || this.items_provinces.length === 0) {
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
      this.sendEmailNotification();
      this.sendEmailNotificationRequester();
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
    const postalCode = formValue.postalCode.split('-')[0];

    formValue.postalCode = postalCode;

    if (this.listDataByTaxId) {
      formValue.id = 0
    }
    else if (!this.customerId) {
      delete formValue.id;
    }
    formValue.userId = currentUser.user.userId;
    return formValue;
  }

  getCustomerType(): void {
    this.customerService.getCustomerType().subscribe({
      next: (response: any) => {
        this.listOfType = response;
        if (this.isAdmin || this.isApproved) {
          this.filteredDataType = this.listOfType;
        } else {
          this.filteredDataType = this.listOfType.filter(type => ['LOCL', 'OSEA', 'ARTS'].includes(type.code));
        }
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
        UserId: currentUser.user.userId || 0,
        Username: currentUser.user.username || 'string',
        Email: currentUser.user.email || 'string',
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
          let updatedStatus = log.status;

          if (log.status === "Pending Approved By ACC" && log.rejectReason === '') {
            if (log.roleId === 2 || log.roleId === 1) {
              updatedStatus = "Submitted";
            } else if (log.roleId === 3) {
              updatedStatus = "Edit By ACC";
            }
          }
          if (log.status === "Pending Approved By ACC" && log.rejectReason !== '') {
            if (log.roleId === 3 || log.roleId === 1) {
              updatedStatus = "Reject By ACC";
            }
          }

          return {
            ...log,
            time: this.formatDateTime(log.time),
            status: updatedStatus
          };
        });
        if (this.logs.length > 0 && this.logs[0].status === "Submitted") {
          const originalLog = data.find(log => log.status === "Pending Approved By ACC");
          if (originalLog) {
            this.logs.unshift({
              status: "Pending Approved By ACC",
              time: this.formatDateTime(originalLog.time) // ใช้เวลาเดิม
            });
          }
        }
        if (this.logs.length > 0 && this.logs[0].status === "Approved By ACC") {
          const originalLog = data.find(log => log.status === "Approved By ACC");
          if (originalLog) {
            this.logs.unshift({
              status: this.statusforUpdate,
            });
          }
        }
        if (this.logs.length > 0 && this.logs[0].status === "Reject By ACC") {
          const originalLog = data.find(log => log.status === "Reject By ACC");
          if (originalLog) {
            this.logs.unshift({
              status: 'Waiting For Admin Submit',
              rejectReason: originalLog.rejectReason
            });
          }
        }
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
    if (this.customerForm.get('status')?.value === 'Pending Approved By ACC') {
      const company = this.customerForm.get('company')?.value;
      const customerName = this.customerForm.get('name')?.value;
      const TaxID = this.customerForm.get('taxId')?.value;

      var name = ''
      this.userService.findUserById(this.idreq).subscribe((data: any) => {
        name = data.firstname
        this.customerService.findApproversByCompany(company).subscribe(
          (approvers) => {
            approvers.forEach((approver: any) => {
              const to = approver.email;
              const subject = 'OnePortal Notification';
              const body = `
              <p>เรียน ส่วนงานบัญชี</p>
              <br>
              <p>เรื่อง : คำขอเปิด Customer ใหม่</p>
              <br>
              <p>มีคำขอเปิด Customer ใหม่ จาก คุณ ${name} </p>
              <br>
              <p>เราได้รับคำขอเปิด Customer: ${customerName} Tax ID:${TaxID} ของคุณแล้ว</p>
              <br>
              <p>สถานะคำขอของคุณ: ${this.customerForm.get('status')?.value} </p>
              <br>
              <p>คุณสามารถติดตามสถานะคำขอของคุณได้ที่ <a href='http://10.10.0.28:8085/'>ลิงก์นี้</a></p>
              <br>
              <p>Best Regards</p>
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
        this._cdr.markForCheck();
      });

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

  async onFileSelected(event: Event, file: any): Promise<void> {
    const input = event.target as HTMLInputElement;

    // ตรวจสอบว่า input.files มีค่าและมีความยาวมากกว่า 0
    if (!input.files || input.files.length === 0) {
      Swal.fire('ไม่มีไฟล์', 'กรุณาเลือกไฟล์ก่อนดำเนินการ', 'warning');
      return;
    }

    const selectedFile = input.files[0];

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'pdf' || selectedFile.type !== 'application/pdf') {
      Swal.fire('ไฟล์ไม่รองรับ', 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น', 'warning');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      if (pageCount > 4) {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่สามารถแนบไฟล์ได้',
          text: `ไฟล์ PDF มี ${pageCount} หน้า กรุณาเลือกไฟล์ที่มีไม่เกิน 4 หน้า`,
          confirmButtonText: 'ตกลง',
        });
        return;
      }

      const fileNameWithoutExt = selectedFile.name.replace(`.${fileExtension}`, '');
      const randomId = this.generateUUID();
      const uniqueFileName = `watermarked_${randomId}.${fileExtension}`;

      // อัปเดตฟอร์มตามประเภทไฟล์
      if (file.fileName === 'ใบขอเปิด Customer') {
        this.customerForm.patchValue({ fileReq: uniqueFileName });
      } else if (file.fileName === 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน') {
        this.customerForm.patchValue({ fileCertificate: uniqueFileName });
      } else if (file.fileName === 'ภพ.20') {
        this.customerForm.patchValue({ fileCertificateATR: uniqueFileName });
      } else if (file.fileName === 'อื่น ๆ') {
        this.customerForm.patchValue({ fileOrther: uniqueFileName });
      }

      file.filePath = uniqueFileName;

      const renamedFile = new File([selectedFile], uniqueFileName, { type: selectedFile.type });
      this.listfile.push(renamedFile);
      console.log("this.listfile : ", this.listfile);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'ไม่สามารถตรวจสอบจำนวนหน้าในไฟล์ PDF ได้ ไฟล์อาจมีการเข้ารหัสหรือเสียหาย กรุณาลองใหม่อีกครั้ง',
        confirmButtonText: 'ตกลง',
      });
      console.error('Error checking PDF pages:', error);
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

  getAdjustedFilePath(filePath: string): string {
    let adjustedFilePath = filePath;

    const isLocalhost = window.location.hostname.includes('localhost');

    const baseURL = 'http://10.10.0.28:8088/uploads';

    if (isLocalhost) {
      if (!filePath.includes('localhost')) {
        adjustedFilePath = `https://localhost:7126/uploads/${filePath}`;
      } else {
        adjustedFilePath = filePath.replace('localhost:2222', 'localhost:7126');
      }
    } else {
      adjustedFilePath = `${baseURL}/${filePath}`;
    }

    return adjustedFilePath;
  }


  extractFileName(filePath: string): string {
    return filePath.split('/').pop() || '';
  }

  removeFile(file: any): void {
    file.filePath = '';
    if (file.fileName === 'ใบขอเปิด Customer') {
      this.customerForm.patchValue({ fileReq: '' });
    } else if (file.fileName === 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน') {
      this.customerForm.patchValue({ fileCertificate: '' });
    }
    else if (file.fileName === 'ภพ.20') {
      this.customerForm.patchValue({ fileCertificateATR: '' });
    }
    else if (file.fileName === 'อื่น ๆ') {
      this.customerForm.patchValue({ fileOther: '' });
    }
  }

  sendEmailNotificationRequester(): void {
    this.getTelACC();
    const status = this.customerForm.get('status')?.value;
    var to = ''
    var subject = ''
    var body = ''
    this.userService.findUserById(this.idreq).subscribe((data: any) => {
      this.userData = data

      if (status === 'Pending Approved By ACC') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : คำขอเปิด Customer ใหม่</p>
        <br>
        <p>คำขอเปิด Customer ใหม่ ของท่าน ส่งให้ส่วนงานบัญชีเรียบร้อยแล้ว</p>
        <br>
        <p>Customer Name : ${this.customerForm.get('name')?.value}</p>
        <p>Tax ID : ${this.customerForm.get('taxId')?.value} </p>
        <p>Type: ${this.customerForm.get('customerType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a href='http://10.10.0.28:8085//feature/customer/view/${this.customerForm.get('id')?.value}'>ลิงก์นี้</a></p>
        <br>
        <p>หากพบเจอปัญหาของระบบ สามารถติดต่อ IT #9432</p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      else if (status === 'Reject By ACC') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : มีการเปลี่ยนแปลงสถานะคำขอเปิด Customer ของท่าน</p>
        <br>
        <p>คำขอ Customer ของท่าน ${status} โดยส่วนงานบัญชี</p>
        <br>
        <p>Customer Name : ${this.customerForm.get('name')?.value}</p>
        <p>Tax ID : ${this.customerForm.get('taxId')?.value} </p>
        <p>Type: ${this.customerForm.get('customerType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a href='http://10.10.0.28:8085//feature/customer/view/${this.customerForm.get('id')?.value}'>ลิงก์นี้</a></p>
        <br>
        <p>หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้ที่บัญชี ${this.tel}</p>
        <p>หรือหากพบเจอปัญหาของระบบ สามารถติดต่อ IT #9432</p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      else if (status === 'Approved By ACC') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : มีการเปลี่ยนแปลงสถานะคำขอเปิด Customer ของท่าน</p>
        <br>
        <p>คำขอ Customer ของท่าน ได้รับการอนุมัติ เรียบร้อยแล้ว อยู่ระหว่างการนำข้อมูลเข้าระบบ ERP Oracle </p>
        <br>
        <p>Customer Number : ${this.customerForm.get('customerNum')?.value}</p>
        <p>Customer Name : ${this.customerForm.get('name')?.value}</p>
        <p>Tax ID : ${this.customerForm.get('taxId')?.value} </p>
        <p>Type: ${this.customerForm.get('customerType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a href='http://10.10.0.28:8085//feature/customer/view/${this.customerForm.get('id')?.value}'>ลิงก์นี้</a></p>
        <br>
        <p>หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้ที่บัญชี ${this.tel}</p>
        <p>หรือหากพบเจอปัญหาของระบบ สามารถติดต่อ IT #9432</p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      this.emailService.sendEmail(to, subject, body).subscribe(
        (response) => {
        },
        (error) => {
          console.error('Error sending email', error);
        }
      );
      this._cdr.markForCheck();
    });


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
    const userCompanies = CheckcurrentUser.user.company ? CheckcurrentUser.user.company.split(',') : [];

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
      next: (response) => {
        if (response) {
          Swal.fire({
            icon: 'question',
            title: 'พบข้อมูล Customer นี้ต้องการใช้ที่อยู่เดิมหรือไม่?',
            html: `
                  <div style="text-align: left;">
                    <p><strong>Name:</strong> ${response.customerName || '-'}</p>
                    <p><strong>Tax ID:</strong> ${response.taxReference || '-'}</p>
                    <p><strong>Address:</strong> ${response.address1 || '-'} ${response.address2 || '-'}</p>
                    <p><strong>Subdistrict:</strong> ${response.address3 || '-'}</p>
                    <p><strong>District:</strong> ${response.address4 || '-'}</p>
                    <p><strong>Province:</strong> ${response.province || '-'}</p>
                    <p><strong>Postal Code:</strong> ${response.postal || '-'}</p>
                  </div>
                `,
            showCancelButton: true,
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ไม่ใช่'
          }).then((result) => {
            if (result.isConfirmed) {
              // กด OK (ตกลง) -> Map ข้อมูลเดิมให้
              this.customerForm.patchValue({
                name: response.customerName || '-',
                taxId: response.taxReference || '-',
                addressSup: response.address1 || '-',
                addressDetail: response.address2 || '-',
                postalCode: (response.postal ? response.postal + '-' + (response.address3 || '-') : '-'),
                district: response.address4 || '-',
                subdistrict: response.address3 || '-',
                province: response.province || '-',
                isAddressOld: 'Yes'
              });
              Swal.fire({
                icon: 'success',
                title: 'ใช้ที่อยู่เดิมเรียบร้อย',
                confirmButtonText: 'ตกลง'
              });
            } else {
              this.customerForm.patchValue({
                isAddressOld: 'No'
              });
              Swal.fire({
                icon: 'info',
                title: 'ไม่ใช้ที่อยู่เดิม',
                text: 'กรุณากรอกข้อมูลใหม่',
                confirmButtonText: 'ตกลง'
              });
            }
          });
        }
      },
      error: (err) => {
        console.error('Error occurred:', err.message);
        // แสดง Popup แรกแจ้งเตือนข้อมูลซ้ำ
        Swal.fire({
          icon: 'warning',
          title: 'ข้อมูลซ้ำ',
          html: `
                  <div style="text-align: left;">
                    <p><strong>Name:</strong> ${err.customerName || '-'}</p>
                    <p><strong>CustomerNumber:</strong> <u>${err.customerNumber || '-'}</u></p>
                    <p><strong>Tax ID:</strong> ${err.taxReference || '-'}</p>
                    <p><strong>Address:</strong> ${err.address1 || '-'} ${err.address2 || '-'}</p>
                    <p><strong>Subdistrict:</strong> ${err.address3 || '-'}</p>
                    <p><strong>District:</strong> ${err.address4 || '-'}</p>
                    <p><strong>Province:</strong> ${err.province || '-'}</p>
                    <p><strong>Postal Code:</strong> ${err.postal || '-'}</p>
                  </div>
                `,
          confirmButtonText: 'ปิด'
        }).then(() => {
          this.customerForm.patchValue({
            company: err.company || ''
          });
        });
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

  onEnterKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();

      const targetElement = event.target as HTMLElement;

      if (targetElement && targetElement.closest) {
        const form = targetElement.closest('form') as HTMLFormElement;
        const inputs = Array.from(form.querySelectorAll('input'));
        const currentIndex = inputs.indexOf(targetElement as HTMLInputElement);

        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          const nextInput = inputs[currentIndex + 1] as HTMLInputElement;
          nextInput.focus();
        }
      }
    }
  }

  getTelACC() {
    const idOnwer = this.originalData.ownerAcc;
    if (idOnwer) {
      this.userService.findUserById(idOnwer).subscribe((data: any) => {
        this.tel = data.tel;
      });
    }
    else {
      if (this.isApproved) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.userService.findUserById(currentUser.user.userId).subscribe((data: any) => {
          this.tel = data.tel
        });
      }
    }
  }

  generateUUID() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return [...array].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  openModalold(filePath: string): void {
    const pdfUrl = this.getAdjustedFilePath(filePath);
    this.modalDataService.setData(pdfUrl);
    this.modal.create({
      nzTitle: 'PDF Viewer',
      nzContent: PdfViewerComponent,
      nzFooter: null,
      nzWidth: '55vw',
      nzStyle: { top: '10px' },
      nzClassName: 'scroll'
    });
  }

  preventThaiInput(event: KeyboardEvent) {
    this.validationService.preventThaiInput(event);
  }

  sanitizeInput(field: string): void {
    let value = this.customerForm.get(field)?.value || '';
    const customerType = this.customerForm.get('customerType')?.value;

    if (customerType === '1F' || customerType === 'OSEA') {
      value = value.replace(/[\u0E00-\u0E7F]/g, '');
      this.customerForm.patchValue({ [field]: value }, { emitEvent: true });
    }
  }
}