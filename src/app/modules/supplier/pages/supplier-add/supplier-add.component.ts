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
import { prefixService } from '../../../../shared/constants/prefix.service';

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
  selectedPrefix: string = '';  // ค่าคำนำหน้าที่ถูกเลือก
  nameInput: string = '';       // ค่าที่กรอกในช่องชื่อ
  fullName: string = '';        // ค่าที่รวมคำนำหน้าและชื่อเข้าด้วยกัน
  constructor(private _location: Location, private fb: FormBuilder
    , private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef,
    private bankMasterService: BankMasterService,
    private emailService: EmailService,
    private modal: NzModalService,
    private prefixService : prefixService
  ) { }

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
      supplier_num: ['', Validators.required],
      supplier_type: ['', Validators.required],
      site: ['00000', Validators.required],
      vat: [''],
      status: ['', Validators.required],
      payment_method: ['', Validators.required],
      company: ['', Validators.required],
      type: ['Supplier', Validators.required],
      user_id: [''],
      prefix:[''],
      mobile: ['', Validators.required],
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
    this.supplierForm.get('supplier_type')!.valueChanges.subscribe(value => {
      const supplierTypeId = this.getSupplierTypeId(value);
      if (supplierTypeId) {
        this.loadSupplierType(supplierTypeId); // เรียกใช้ฟังก์ชันนี้เมื่อมีการเปลี่ยนแปลงค่า supplier_type
      }
    });

    this.supplierForm.get('payment_method')?.valueChanges.subscribe(value => {
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
    // this.supplierBankForm.get('name_bank')!.valueChanges.subscribe(value => {
    //   this.onBankNameChange(value);
    // });

    this.checkRole();
  }

  onNameBlur(): void {
    const nameControl = this.supplierForm.get('name');
    let nameValue = nameControl?.value || '';
  
    // ตรวจสอบว่า name ถูกกรอกหรือไม่ ถ้าไม่ถูกกรอกก็ไม่ต้องทำอะไร
    if (!nameValue) {
      return;
    }
  
    // ถ้ามีคำว่า "จำกัด" หรือ "จำกัด (มหาชน)" ต่อท้ายอยู่แล้ว ไม่ต้องเพิ่มอะไร
    if (nameValue.endsWith(' จำกัด') || nameValue.endsWith(' จำกัด (มหาชน)')) {
      return;
    }
  
    // เพิ่มข้อความต่อท้ายตาม prefix ที่เลือก
    if (this.selectedPrefix === 'บริษัทจำกัด') {
      nameControl?.setValue(`${nameValue} จำกัด`);
    } else if (this.selectedPrefix === 'บริษัทจำกัด (มหาชน)') {
      nameControl?.setValue(`${nameValue} จำกัด (มหาชน)`);
    }
  }
  
  updateNameWithPrefixChange(): void {
    const nameControl = this.supplierForm.get('name');
    let nameValue = nameControl?.value || '';
  
    // ตรวจสอบว่า name ถูกกรอกหรือไม่ ถ้าไม่ถูกกรอกก็ไม่ต้องทำอะไร
    if (!nameValue) {
      return;
    }
  
    // ลบ " จำกัด" หรือ " จำกัด (มหาชน)" ออกก่อน
    nameValue = nameValue.replace(/ จำกัด \(มหาชน\)$/, '').replace(/ จำกัด$/, '');
  
    // เพิ่มข้อความต่อท้ายใหม่ตาม prefix ที่เลือก
    if (this.selectedPrefix === 'บริษัทจำกัด') {
      nameControl?.setValue(`${nameValue} จำกัด`);
    } else if (this.selectedPrefix === 'บริษัทจำกัด (มหาชน)') {
      nameControl?.setValue(`${nameValue} จำกัด (มหาชน)`);
    } else {
      nameControl?.setValue(nameValue); // กรณีเลือก prefix อื่นๆ จะไม่ต่อข้อความใดๆ
    }
  }

  validateTaxId(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขหรือตัวอักษร '-'
    let numericValue = input.replace(/[^0-9-]/g, '');

    // จำกัดจำนวนเครื่องหมาย '-' ให้มีเพียงตัวเดียว
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      // ถ้ามี '-' มากกว่า 1 ตัว ให้ลบตัวถัดไปทั้งหมด
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    // อัปเดตค่าใน form control
    this.supplierForm.patchValue({ tax_Id: numericValue });
    event.target.value = numericValue;
  }

  validateTel(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขหรือตัวอักษร '-'
    let numericValue = input.replace(/[^0-9-]/g, '');

    // จำกัดจำนวนเครื่องหมาย '-' ให้มีเพียงตัวเดียว
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      // ถ้ามี '-' มากกว่า 1 ตัว ให้ลบตัวถัดไปทั้งหมด
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    // จำกัดจำนวนตัวเลขไม่เกิน 10 และต้องใส่ '-' ได้เพียงตัวเดียว
    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    // อัปเดตค่าใน form control
    this.supplierForm.patchValue({ tel: event.target.value });
  }

  validateMobile(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขหรือตัวอักษร '-'
    let numericValue = input.replace(/[^0-9-]/g, '');

    // จำกัดจำนวนเครื่องหมาย '-' ให้มีเพียงตัวเดียว
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      // ถ้ามี '-' มากกว่า 1 ตัว ให้ลบตัวถัดไปทั้งหมด
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    // จำกัดจำนวนตัวเลขไม่เกิน 10 และต้องใส่ '-' ได้เพียงตัวเดียว
    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    // อัปเดตค่าใน form control
    this.supplierForm.patchValue({ mobile: event.target.value });
  }

  validateSite(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
    const numericValue = input.replace(/\D/g, '');

    // อัปเดตค่าใน form control
    this.supplierForm.patchValue({ site: numericValue });
    event.target.value = numericValue;
  }

  validateBranch(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขหรือตัวอักษร '-'
    let numericValue = input.replace(/[^0-9-]/g, '');

    // จำกัดจำนวนเครื่องหมาย '-' ให้มีเพียงตัวเดียว
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      // ถ้ามี '-' มากกว่า 1 ตัว ให้ลบตัวถัดไปทั้งหมด
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    // จำกัดจำนวนตัวเลขไม่เกิน 10 และต้องใส่ '-' ได้เพียงตัวเดียว
    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    // อัปเดตค่าใน form control
    this.supplierBankForm.patchValue({ branch: event.target.value });
  }

  validateBranchAdd(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขหรือตัวอักษร '-'
    let numericValue = input.replace(/[^0-9-]/g, '');

    // จำกัดจำนวนเครื่องหมาย '-' ให้มีเพียงตัวเดียว
    const hyphenCount = (numericValue.match(/-/g) || []).length;

    if (hyphenCount > 1) {
      // ถ้ามี '-' มากกว่า 1 ตัว ให้ลบตัวถัดไปทั้งหมด
      numericValue = numericValue.replace(/-/g, '-').replace('-', '');
    }

    // จำกัดจำนวนตัวเลขไม่เกิน 10 และต้องใส่ '-' ได้เพียงตัวเดียว
    if (numericValue.replace(/-/g, '').length > 10) {
      numericValue = numericValue.slice(0, 10) + (hyphenCount ? '-' : '');
    }

    event.target.value = numericValue;

    // อัปเดตค่าใน form control
    this.supplierBankFormAdd.patchValue({ branch: event.target.value });
  }

  validateAccountNum(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
    const numericValue = input.replace(/\D/g, '');

    // อัปเดตค่าใน form control
    this.supplierBankForm.patchValue({ account_num: numericValue });
    event.target.value = numericValue;
  }

  validateAccountNumAdd(event: any): void {
    const input = event.target.value;

    // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
    const numericValue = input.replace(/\D/g, '');

    // อัปเดตค่าใน form control
    this.supplierBankFormAdd.patchValue({ account_num : numericValue });
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

  hideBankCopy() {
    this.showSupplierBankFormAdd = false;
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
      }

    });
  }

  loadSupplierData(id: number): void {
    this.supplierService.findSupplierById(id).subscribe((data: any) => {
      const postalCodeCombination = data.postalCode + '-' + data.subdistrict;
      // อัปเดตฟอร์มด้วยค่าใหม่
      this.supplierForm.patchValue({
        ...data,
        postalCode: postalCodeCombination
      });

      console.log("527",this.supplierForm.value);
      
      // เรียกฟังก์ชันอื่นหลังจากการอัปเดตฟอร์มเสร็จสิ้น
      this.loadSupplierBank(id);
      this.getEventLogs(id);
    });
  }

  loadSupplierBank(id: number): void {
    this.supplierService.findSupplierBankBySupplierId(id).subscribe((data: any[]) => {
      this._cdr.detectChanges();
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
        this.showSupplierBankForm = true
      }
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
        this.showSupplierBankForm = true
        this.showSupplierBankFormAdd = true; // แสดงฟอร์มที่สอง
      }
    });
  }

  loadSupplierType(id: number): void {
    this.supplierService.findSupplierTypeById(id).pipe(debounceTime(300), distinctUntilChanged()).subscribe((data: any) => {
      const SupplierNumPrefix = data.code_from;
      this.typeCode = SupplierNumPrefix;
      if (SupplierNumPrefix === '2F') {
        // Default customer_num เป็น "-" และซ่อนฟิลด์อื่นๆ
        this.supplierForm.patchValue({
          supplier_num: '-',
          postalCode: '-',
          province: '-',
          district: '-',
          subdistrict: '-',
          site: '',
          vat: '-',
          company: '-',
          payment_method: '-'
        });
      }
      // else {
      //   this.supplierService.getTopSupplierByType(data.code).subscribe(topSupplierData => {
      //     let newSupplierNum: string;
      //     if (topSupplierData.supplier_num === '000') {
      //       // ถ้าไม่เจอข้อมูล ให้ใช้ค่า default
      //       newSupplierNum = SupplierNumPrefix + '000001';
      //     } else {
      //       // ถ้าเจอข้อมูล ใช้ค่า supplier_num ที่ดึงมาแล้ว increment
      //       newSupplierNum = this.incrementSupplierNum(topSupplierData.supplier_num, SupplierNumPrefix);
      //     }

      //     this.supplierForm.patchValue({ supplier_num: newSupplierNum });
      //     this.supplierForm.patchValue({ site: '00000' });
      //     this.supplierForm.patchValue({ id: 0 });
      //   });
      // }
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
  }

  onPostalCodeChange(value: any): void {
    // หา selected item โดยใช้ทั้ง postalCode และบางค่าเฉพาะ เช่น subdistrict
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

  // ฟังก์ชันช่วยเพื่อหาค่า subdistrict ที่ตรงกัน
  isSubdistrictMatching(item: DataLocation): boolean {
    const currentSubdistrict = this.supplierForm.get('subdistrict')?.value;
    return item.subdistrict === currentSubdistrict;
  }

  onSubmit(): void {

    if (this.isViewMode) {
      this.supplierForm.enable();
      this.supplierBankForm.enable();
      this.supplierBankFormAdd.enable();
    }

    if (this.supplierForm.value.email === '-') {
      this.emailError = '';
    }
    console.log("504", this.supplierForm.value.email);

    // if (this.isSubmitting) {
    //   return; // ป้องกันการ submit ซ้ำ
    // }
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

            if (response && response.supplier_id) {
              this.supplierBankForm.patchValue({ supplier_id: response.supplier_id, company: response.company });
              this.isIDTemp = response.supplier_id
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
        Swal.fire('Error!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
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
          console.log("584",this.supplierForm.value);
          
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
      formValue.postalCode = selectedPostItem.postalCode; // ใช้ค่า postalCode ที่ถูกต้อง
      formValue.post_id = selectedPostItem.post_id; // เพิ่ม post_id เข้าไปใน formValue
    }
    formValue.user_id = currentUser.userId;
    return formValue;
  }

  getSupplierType(): void {
    this.supplierService.getSupplierType().subscribe({
      next: (response: any) => {
        this.listOfType = response;
        if (this.isUser) {
          // กรองข้อมูลและเก็บผลลัพธ์ไว้ในตัวแปร
          this.filteredDataType = this.listOfType.filter(type => ['LOCL', 'OSEA', 'ARTS'].includes(type.code));
        } else {
          // ถ้าไม่ใช่ role user ให้แสดงทั้งหมด
          this.filteredDataType = this.listOfType;
        }
        console.log("758", this.filteredDataType);
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
        // Handle error
      }
    });
  }

  addBankData(): void {
    const bankFormValue = this.supplierBankForm.value;
    if (this.supplierBankForm.valid) {
      this.supplierService.addBankData(bankFormValue).subscribe({
        next: (response) => {

        },
        error: (err) => {
          console.error('Error adding bank data', err);
        }
      });
    }
    if (this.supplierBankFormAdd) {
      const bankFormValue = this.supplierBankFormAdd.value;

      if (this.supplierBankFormAdd.valid) {
        this.supplierService.addBankData(bankFormValue).subscribe({
          next: (response) => {

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
            // สมมติว่าเลือกแถวที่มี Id สูงสุด
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
          // กรองข้อมูลและเก็บผลลัพธ์ไว้ในตัวแปร
          this.filteredDataPaymentMethod = this.listOfPaymentMethod.filter(type => ['Cheque', 'Transfer'].includes(type.paymentMethodName));
        } else {
          // ถ้าไม่ใช่ role user ให้แสดงทั้งหมด
          this.filteredDataPaymentMethod = this.listOfPaymentMethod;
        }
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

        this.listOfVat = response;


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

  checkSave(event: Event) {
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
      this.CheckDupplicateData();
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

        if(this.suppilerId == null){
          this.setStatusAndSubmit('Draft');
        }
        else{
          if(this.isApproved){
            this.setStatusAndSubmit('Pending Approved By ACC');
            console.log("เข้า approve");
          }
          else{
            this.setStatusAndSubmit('Draft');
          }
        }
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
    if (this.suppilerId == null) {
      this.supplierForm.patchValue({ supplier_num: this.newSupnum });
      this.supplierForm.patchValue({ user_id: this.currentUser?.id });
    }
    console.log("1170",this.supplierForm.value);
    
    this.onSubmit();
  }

  sendEmailNotification(): void {
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
    return this.selectType === 'OSEA';  // ตรวจสอบค่าซึ่งหมายถึง OSEA - ลูกหนี้ต่างประเทศ
  }

  onSupplierTypeOneChange(value: string) {
    if (value === 'One Time') {
      this.isOneTime = true; // ซ่อน input
      this.supplierForm.patchValue({
        supplier_num: '-',
        site: '-',
        supplier_type: '-'
      });
    } else {
      this.isOneTime = false; // แสดง input
    }
  }

  CheckDupplicateData() {
    if (this.supplierForm.value.supplier_num === '') {
      const tax = this.supplierForm.value.tax_Id.trim(); // ลบช่องว่างที่ต้นและท้ายของ tax_Id
      const type = this.typeCode.trim(); // ลบช่องว่างที่ต้นและท้ายของ typeCode
      // สร้าง key โดยการรวม tax_Id และ typeCode
      const key = `${tax}-${type}`;
      this.supplierService.CheckDupplicateSupplier(key).subscribe({
        next: (response: any) => {
          if (response && response.length > 0) {
            Swal.fire({
              icon: 'error',
              title: 'ข้อมูลซ้ำ',
              text: 'มีข้อมูล Supplier นี้อยู่ในฐานข้อมูลอยู่แล้ว โปรดตรวจสอบ TaxID และ Type อีกครั้ง',
              confirmButtonText: 'ปิด'
            });
            return;
          }
        },
        error: (err) => {
          if (err === 'No Supplier found.') {
            // เมื่อไม่พบข้อมูลซ้ำ ให้เรียก GetNumMaxCustomer
            this.supplierService.GetNumMaxSupplier(this.typeCode).subscribe({
              next: (response: any) => {
                if (!response || response.length === 0 || response[0]["MAX(NUM)"] === null) {
                  console.log("1391",response);
                  
                  this.supplierForm.patchValue({ supplier_num: '' });
                } else {
                  const max = response[0]["MAX(NUM)"];
                  const maxStr = String(max);

                  // แยกตัวอักษรและตัวเลข โดยให้แน่ใจว่าตัวอักษรอยู่ข้างหน้า และตัวเลขอยู่ข้างหลัง
                  const matchResult = maxStr.match(/^(\d*[A-Za-z]+)(\d+)$/);
                  const prefix = matchResult ? matchResult[1] : ''; // ตัวอักษรที่รวมตัวเลขแรกด้วย เช่น "1A"
                  const numPart = matchResult ? matchResult[2] : '0'; // เลขส่วนท้าย เช่น "007447"

                  // แปลง numPart เป็นตัวเลข บวก 1
                  const nextNum = String(parseInt(numPart, 10) + 1).padStart(numPart.length, '0');

                  // ประกอบ prefix และเลขใหม่เข้าด้วยกัน
                  const newCustomerNum = `${prefix}${nextNum}`;
                  this.newSupnum = newCustomerNum;
                  // อัปเดตค่าใน form
                  this.supplierForm.patchValue({ supplier_num: newCustomerNum });
                  console.log("New Customer Num:", this.supplierForm.value);
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
  
}
