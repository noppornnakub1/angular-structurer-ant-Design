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
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { ValidationService } from '../../../../shared/constants/ValidationService';

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

interface SelectedFile {
  fileId?: number;
  file: File;
  fileType: string;
  labelText: string;
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
    NzIconModule,
    NzSpaceModule
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
  filteredListOfGroup = [...this.listOfGroup];
  selectedSupplierGroup: string | null = null;
  selectedSupplierGroupAdd: string | null = null;
  emailError: string = '';
  isOneTime = false;
  typeCode: string = '';
  newSupnum: string = '';
  selectedFileSupplier: File | null = null;
  selectedFile: File | null = null;
  selectedFileAdd: File | null = null;
  selectedFilesSupplier: SelectedFile[] = [];
  selectedNewFilesSupplier: SelectedFile[] = [];
  selectedFiles: SelectedFile[] = [];
  selectedFilesAdd: SelectedFile[] = [];
  fileIdsToRemove: number[] = [];
  fileIdsToRemoveBank: number[] = [];
  fileIdsToRemoveBankAdd: number[] = [];
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
  files = [
    { fileName: 'ใบขอเปิด Supplier', fileType: '', filePath: '', labelText: 'ใบขอเปิด Supplier' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: '', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน' },
  ];

  filesBank = [
    { fileName: 'หนังสือยินยอมการโอนเงิน', fileType: '', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: '', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน' },
    { fileName: 'สำเนาหน้า Book Bank', fileType: '', filePath: '', labelText: 'สำเนาหน้า Book Bank' },
  ];
  filesBankAdd = [
    { fileName: 'หนังสือยินยอมการโอนเงิน', fileType: 'gchGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ACT]' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'gchGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ACT]' },
    { fileName: 'สำเนาหน้า Book Bank', fileType: 'gchGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ACT]' },
  ];
  file: any;
  filess: Array<{ fileName: string; fileType: string; filePath: string; labelText: string; }> = [];
  displayFiles: Array<{ fileType: string; fileName: string; filePath: string; labelText: string; }> = [];
  displayFilesBank: Array<{ fileName: string, fileType: string, filePath: string, labelText?: string }> = [];
  displayFilesBankAdd: Array<{ fileName: string, fileType: string, filePath: string, labelText?: string }> = [];
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
    private prefixService: prefixService,
    private validationService: ValidationService

  ) { }

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      id: [0],
      prefix: ['', Validators.required],
      name: ['', Validators.required],
      tax_Id: ['', Validators.required],
      addressSup: ['', Validators.required],
      district: ['', Validators.required],
      subdistrict: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      tel: ['', Validators.required],
      email: ['', Validators.required],
      supplierNum: [''],
      supplierType: ['', Validators.required],
      site: ['00000', Validators.required],
      vat: [''],
      status: ['', Validators.required],
      paymentMethod: ['', Validators.required],
      company: ['', Validators.required],
      type: ['Supplier', Validators.required],
      userId: [''],
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

      this.supplierForm.patchValue({
        prefix: this.item_prefix.length > 0 ? this.item_prefix[0].name : ''
      });
    });
    this.showSupplierBankForm = false;
    this.showSupplierBankFormAdd = false;
    this.getSupplierType();
    this.getDataBank();
    this.getDataPaymentMethod();
    this.getDataVAT();
    this.getDataCompany();

    this.supplierForm.get('supplierType')?.valueChanges.subscribe(value => {
      const supplierTypeId = this.getSupplierTypeId(value);
      if (supplierTypeId) {
        this.loadSupplierType(supplierTypeId);
      }
    });

    this.supplierForm.get('paymentMethod')?.valueChanges.subscribe(value => {
      this.toggleSupplierBankForm(value);
    });

    this.supplierForm.get('name')?.valueChanges.subscribe((value: string) => {
      this.supplierBankForm.patchValue({ accountName: this.supplierForm.value.name });
      this.supplierBankFormAdd.patchValue({ accountName: this.supplierForm.value.name });
      this._cdr.detectChanges();
    });

    this.supplierForm.get('prefix')?.valueChanges.subscribe((prefix: string) => {
      this.selectedPrefix = prefix;
      this.updateNameWithPrefixChange();
      this._cdr.detectChanges();
    });

    this.supplierBankForm.get('supplierGroup')?.valueChanges.subscribe(value => {
      if (value === 'ALL Group') {
        this.filesBank = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [ONE Group]', fileType: 'oneGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ONE Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]', fileType: 'oneGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]' },
          { fileName: 'สำเนาหน้า Book Bank [ONE Group]', fileType: 'oneGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ONE Group]' },
          { fileName: 'หนังสือยินยอมการโอนเงิน [GCH Group]', fileType: 'gchGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [GCH Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]', fileType: 'gchGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]' },
          { fileName: 'สำเนาหน้า Book Bank [GCH Group]', fileType: 'gchGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [GCH Group]' }
        ];
      }
      else if (value === 'ONE GROUP') {
        this.filesBank = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [ONE Group]', fileType: 'oneGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ONE Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]', fileType: 'oneGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]' },
          { fileName: 'สำเนาหน้า Book Bank [ONE Group]', fileType: 'oneGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ONE Group]' },
        ];
      }
      else if (value === 'GCH GROUP') {
        this.filesBank = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [GCH Group]', fileType: 'gchGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [GCH Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]', fileType: 'gchGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]' },
          { fileName: 'สำเนาหน้า Book Bank [GCH Group]', fileType: 'gchGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [GCH Group]' }
        ];
      }
      else if (value === 'ACT') {
        this.filesBank = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [ACT]', fileType: 'actGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ACT]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ACT]', fileType: 'actGroupCertificationFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ACT]' },
          { fileName: 'สำเนาหน้า Book Bank [ACT]', fileType: 'actGroupBookBankFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ACT]' },
        ];
      }
    });

    this.supplierBankFormAdd.get('supplierGroup')?.valueChanges.subscribe(value => {
      if (value === 'ALL Group') {
        this.filesBankAdd = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [ONE Group]', fileType: 'oneGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ONE Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]', fileType: 'oneGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]' },
          { fileName: 'สำเนาหน้า Book Bank [ONE Group]', fileType: 'oneGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ONE Group]' },
          { fileName: 'หนังสือยินยอมการโอนเงิน [GCH Group]', fileType: 'gchGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [GCH Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]', fileType: 'gchGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]' },
          { fileName: 'สำเนาหน้า Book Bank [GCH Group]', fileType: 'gchGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [GCH Group]' }
        ];
      }
      else if (value === 'ONE GROUP') {
        this.filesBankAdd = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [ONE Group]', fileType: 'oneGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [ONE Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]', fileType: 'oneGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]' },
          { fileName: 'สำเนาหน้า Book Bank [ONE Group]', fileType: 'oneGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ONE Group]' },
        ];
      }
      else if (value === 'GCH GROUP') {
        this.filesBankAdd = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [GCH Group]', fileType: 'gchGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน [GCH Group]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]', fileType: 'gchGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]' },
          { fileName: 'สำเนาหน้า Book Bank [GCH Group]', fileType: 'gchGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [GCH Group]' }
        ];
      }
      else if (value === 'ACT') {
        this.filesBankAdd = [
          { fileName: 'หนังสือยินยอมการโอนเงิน [ACT]', fileType: 'actGroupConsentFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ACT]' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ACT]', fileType: 'actGroupCertificationFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ACT]' },
          { fileName: 'สำเนาหน้า Book Bank [ACT]', fileType: 'actGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank [ACT]' },
        ];
      }
    });

    this.supplierBankForm.get('supplierGroup')?.valueChanges.subscribe((selectedGroup: string) => {
      if (selectedGroup === 'ALL Group') {
        this.showSupplierBankFormAdd = false;
      }
      this.updateFilteredSupplierGroups(selectedGroup);
    });
    this.checkRole();
    this.displayFiles = this.filess && this.filess.length > 0 ? this.filess : this.files;
  }

  onFileSelectSupplier(event: Event, fileType: string, labelText: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];

      const fileToUpdate = this.displayFiles.find(file => file.fileType === fileType && file.labelText === labelText);

      if (fileToUpdate) {
        fileToUpdate.filePath = '';
        fileToUpdate.fileName = selectedFile.name;

        this.selectedFilesSupplier = this.selectedFilesSupplier.filter(file => file.fileType !== fileType || file.labelText !== labelText);

        if ('fileId' in fileToUpdate) {
          const fileIdToRemove = (fileToUpdate as any).fileId;
          if (fileIdToRemove) {
            this.fileIdsToRemove.push(fileIdToRemove);
          }
        }

        const newFile = {
          file: selectedFile,
          fileType: fileType,
          labelText: labelText
        };
        this.selectedFilesSupplier.push(newFile);

        this._cdr.detectChanges();
      }
    }
  }

  onFileSelectNew(event: Event, fileType: string, labelText: string, isFromFilesBankAdd: boolean = false): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];
      let fileToUpdate;

      if (isFromFilesBankAdd) {
        fileToUpdate = this.filesBankAdd.find(file => file.fileType === fileType && file.labelText === labelText);
      } else {
        fileToUpdate = this.filesBank.find(file => file.fileType === fileType && file.labelText === labelText);
      }

      // เช็คว่ามีไฟล์ที่เลือกอยู่แล้วหรือไม่ ถ้ามีให้เคลียร์ออกก่อน
      if (fileToUpdate) {
        fileToUpdate.filePath = '';
        fileToUpdate.fileName = selectedFile.name;

        // ลบไฟล์เก่าออกจาก array ถ้ามีการเลือกไฟล์ใหม่
        if (isFromFilesBankAdd) {
          this.selectedFilesAdd = this.selectedFilesAdd.filter(file => file.fileType !== fileType || file.labelText !== labelText);
        } else {
          this.selectedNewFilesSupplier = this.selectedNewFilesSupplier.filter(file => file.fileType !== fileType || file.labelText !== labelText);
        }

        // ตรวจสอบว่า fileId มีอยู่และเพิ่มเข้าในรายการลบ
        if ('fileId' in fileToUpdate) {
          const fileId = (fileToUpdate as any).fileId;
          if (fileId) {
            if (isFromFilesBankAdd) {
              this.fileIdsToRemoveBankAdd.push(fileId);
            } else {
              this.fileIdsToRemoveBank.push(fileId);
            }
          }
        }
      }

      // สร้างไฟล์ใหม่
      const newFile = {
        file: selectedFile,
        fileType: fileType,
        labelText: labelText
      };

      // เพิ่มไฟล์ใหม่เข้าไปใน array
      if (isFromFilesBankAdd) {
        this.selectedFilesAdd.push(newFile);
      } else {
        this.selectedNewFilesSupplier.push(newFile);
        console.log(this.selectedNewFilesSupplier, "456");
      }

      this._cdr.detectChanges();
    }
  }

  onFileSelect(event: Event, fileType: string, labelText: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles.push({
        file: input.files[0],
        fileType,
        labelText
      });
    }
  }

  onFileSelectAdd(event: Event, fileType: string, labelText: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFilesAdd = [];
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFilesAdd.push({
          file: input.files[i],
          fileType,
          labelText
        });
      }
    }
  }

  onNameBlur(): void {
    const nameControl = this.supplierForm.get('name');
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
  }

  updateNameWithPrefixChange(): void {
    const nameControl = this.supplierForm.get('name');
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
    const numericValue = this.validationService.validateTaxId(input);  // เรียกใช้ฟังก์ชันจาก service
    this.supplierForm.patchValue({ taxId: numericValue });
    event.target.value = numericValue;
  }

  validateTel(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTel(input);  // เรียกใช้ฟังก์ชันจาก service
    event.target.value = numericValue;
    this.supplierForm.patchValue({ tel: numericValue });
  }

  validateMobile(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTel(input);  // เรียกใช้ฟังก์ชันจาก service
    event.target.value = numericValue;
    this.supplierForm.patchValue({ mobile: numericValue });
  }

  validateSite(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateSite(input);  // เรียกใช้ฟังก์ชันจาก service
    event.target.value = numericValue;
    this.supplierForm.patchValue({ site: numericValue });
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
    this.supplierBankForm.patchValue({ accountNum: numericValue });
    event.target.value = numericValue;
  }

  validateAccountNumAdd(event: any): void {
    const input = event.target.value;
    const numericValue = input.replace(/\D/g, '');

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

    if (this.showSupplierBankForm) {
      this.supplierBankForm.patchValue({ accountName: this.supplierForm.value.name });
    }
    this._cdr.detectChanges();
  }

  showBankCopy() {
    this.showSupplierBankFormAdd = true;
    if (this.showSupplierBankFormAdd) {
      this.supplierBankFormAdd.patchValue({ accountName: this.supplierForm.value.name });
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

  updateDisplayFiles(): void {
    if (this.selectedSupplierGroup === 'ONE GROUP') {
      this.displayFilesBank = [
        { fileName: 'หนังสือยินยอมการโอนเงิน [ONE Group]', fileType: 'gchGroupConsentFile', filePath: '' },
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]', fileType: 'gchGroupCertificationFile', filePath: '' },
        { fileName: 'สำเนาหน้า Book Bank [ONE Group]', fileType: 'gchGroupBookBankFile', filePath: '' }
      ];
    } else if (this.selectedSupplierGroup === 'GCH GROUP') {
      this.displayFilesBank = [
        { fileName: 'หนังสือยินยอมการโอนเงิน [GCH Group]', fileType: 'gchGroupConsentFile', filePath: '' },
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]', fileType: 'gchGroupCertificationFile', filePath: '' },
        { fileName: 'สำเนาหน้า Book Bank [GCH Group]', fileType: 'gchGroupBookBankFile', filePath: '' }
      ];
    } else if (this.selectedSupplierGroup === 'ACT') {
      this.displayFilesBank = [
        { fileName: 'หนังสือยินยอมการโอนเงิน [ACT]', fileType: 'gchGroupConsentFile', filePath: '' },
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ACT]', fileType: 'gchGroupCertificationFile', filePath: '' },
        { fileName: 'สำเนาหน้า Book Bank [ACT]', fileType: 'gchGroupBookBankFile', filePath: '' }
      ];
    }
    else if (this.selectedSupplierGroup === 'ALL Group') {
      this.displayFilesBank = [
        { fileName: 'หนังสือยินยอมการโอนเงิน [ONE Group]', fileType: 'gchGroupConsentFile', filePath: '' },
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [ONE Group]', fileType: 'gchGroupCertificationFile', filePath: '' },
        { fileName: 'สำเนาหน้า Book Bank [ONE Group]', fileType: 'gchGroupBookBankFile', filePath: '' },
        { fileName: 'หนังสือยินยอมการโอนเงิน [GCH Group]', fileType: 'gchGroupConsentFile', filePath: '' },
        { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน [GCH Group]', fileType: 'gchGroupCertificationFile', filePath: '' },
        { fileName: 'สำเนาหน้า Book Bank [GCH Group]', fileType: 'gchGroupBookBankFile', filePath: '' }
      ];
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

  removeFile(file: any): void {
    file.filePath = '';
    file.fileName = '';
  }

  getAdjustedFilePath(filePath: string): string {
    let adjustedFilePath = filePath;

    const isLocalhost = window.location.hostname.includes('localhost');

    const baseURL = 'http://10.10.0.28:8088';

    if (isLocalhost) {
      if (!filePath.includes('localhost')) {
        adjustedFilePath = `https://localhost:7126/${filePath}`;
      } else {
        adjustedFilePath = filePath.replace('localhost:2222', 'localhost:7126');
      }
    } else {
      adjustedFilePath = `${baseURL}/${filePath}`;
    }

    return adjustedFilePath;
  }

  loadSupplierData(id: number): void {
    this.supplierService.findSupplierByIdV2(id).subscribe((data: any) => {
      const postalCode = data?.postalCode || '';
      const subdistrict = data?.subdistrict || '';
      const postalCodeCombination = postalCode && subdistrict ? postalCode + '-' + subdistrict : postalCode;
      this.supplierForm.patchValue({
        ...data,
        postalCode: postalCodeCombination
      });

      if (data.supplierFiles && data.supplierFiles.length > 0) {
        this.filess = data.supplierFiles.map((file: any) => ({
          fileId: file.fileId,
          fileName: file.fileName,
          fileType: file.fileType,
          filePath: file.filePath,
          labelText: file.labelText || ''
        }));
      } else {
        this.filess = [
          { fileName: 'ใบขอเปิด Supplier', fileType: 'fileReq', filePath: this.supplierForm.value.fileReq || '', labelText: 'ใบขอเปิด Supplier' },
          { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'fileCertificate', filePath: this.supplierForm.value.fileCertificate || '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน' }
        ];
      }

      this.displayFiles = this.filess;

      this.loadSupplierBank(id);
      this.getEventLogs(id);
    }, error => {
      console.error('Error loading supplier data:', error);
    });
  }

  loadSupplierBank(id: number): void {
    this.supplierService.findSupplierBankBySupplierIdV2(id).subscribe((data: any) => {
      this._cdr.detectChanges();

      if (data.supplierBank.length > 0) {
        const bankData = data.supplierBank[0];

        if (!this.listOfGroup.some(group => group.group_name === bankData.supplierGroup)) {
          this.listOfGroup.push({ group_name: bankData.supplierGroup });
        }

        this.supplierBankForm.patchValue({
          supbankId: bankData.SupbankId,
          supplierId: bankData.SupplierId,
          nameBank: bankData.NameBank,
          branch: bankData.Branch,
          accountNum: bankData.AccountNum,
          supplierGroup: bankData.SupplierGroup,
          accountName: bankData.AccountName,
          company: bankData.Company
        });

        this.showSupplierBankForm = true;
      }

      if (data.supplierBankFiles && data.supplierBankFiles.length > 0) {
        this.filesBank = data.supplierBankFiles.map((file: any) => ({
          fileId: file.FileId,
          fileName: file.FileName,
          fileType: file.FileType,
          filePath: file.FilePath,
          labelText: file.LabelText
        }));
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
      this.toggleFormState(true);
    }

    if (this.supplierForm.value.email === '-') {
      this.emailError = '';
    }

    this.isSubmitting = true;

    if (this.supplierForm.valid) {
      const formData = this.prepareFormData();
      this.assignPostId(formData);

      if (this.suppilerId) {
        this.onUpdate(formData);
      } else {
        if (!this.validateBankForms()) return;

        this.supplierService.addDataWithFiles(formData).subscribe({
          next: (response) => {
            if (response && response.supplier_id) {
              this.handleAddResponse(response);
            }
          },
          error: (err) => {
            console.error('Error saving supplier data:', err);
            Swal.fire('Error!', 'There was an error saving your data.', 'error');
          }
        });
      }
    } else {
      this.handleInvalidForm();
    }
  }

  private toggleFormState(isEnabled: boolean): void {
    this.supplierForm[isEnabled ? 'enable' : 'disable']();
    this.supplierBankForm[isEnabled ? 'enable' : 'disable']();
    this.supplierBankFormAdd[isEnabled ? 'enable' : 'disable']();
  }

  private assignPostId(formData: any): void {
    const selectedPostItem = this.items_provinces.find(
      item => item.postalCode === formData.postalCode && this.isSubdistrictMatching(item)
    );
    if (selectedPostItem) {
      formData.post_id = selectedPostItem.post_id;
    }
  }

  private async handleAddResponse(response: any): Promise<void> {
    if (response && response.supplier_id) {
      this.updateSupplierBankForm(response);

      await this.handleBankForms();

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
  }

  private updateSupplierBankForm(response: any): void {
    this.supplierBankForm.patchValue({ supplierId: response.supplier_id, company: response.company });
    this.isIDTemp = response.supplier_id;
  }

  private async handleBankForms(): Promise<void> {
    const formData = new FormData();
    const supplierBankData = [];
    let mainSupplierId: number | undefined;
    let mainCompany: string | undefined;

    const labelTextsGrouped: { [key: string]: string[] } = {};

    if (this.showSupplierBankForm && this.supplierBankForm.valid) {
      const bankFormValue = this.supplierBankForm.value;
      if (!bankFormValue.supplierId || bankFormValue.supplierId === 0) {
        bankFormValue.supplierId = 0;
      }

      mainSupplierId = bankFormValue.supplierId;
      mainCompany = bankFormValue.company;

      supplierBankData.push(bankFormValue);

      for (let selectedFile of this.selectedNewFilesSupplier) {
        formData.append('Files', selectedFile.file, selectedFile.file.name);
        console.log('Selected File Label Text:', selectedFile.labelText);

        if (!labelTextsGrouped[bankFormValue.supplierGroup]) {
          labelTextsGrouped[bankFormValue.supplierGroup] = [];
        }
        labelTextsGrouped[bankFormValue.supplierGroup].push(selectedFile.labelText);
      }
    }

    if (this.showSupplierBankFormAdd) {
      const bankFormValueAdd = this.supplierBankFormAdd.value;
      if (!bankFormValueAdd.supplierId || bankFormValueAdd.supplierId === 0) {
        bankFormValueAdd.supplierId = mainSupplierId || 0;
      }

      if (!bankFormValueAdd.company && mainCompany) {
        bankFormValueAdd.company = mainCompany;
      }

      supplierBankData.push(bankFormValueAdd);

      for (let selectedFile of this.selectedFilesAdd) {
        formData.append('Files', selectedFile.file, selectedFile.file.name);
        console.log('Selected Add File Label Text:', selectedFile.labelText);

        if (!labelTextsGrouped[bankFormValueAdd.supplierGroup]) {
          labelTextsGrouped[bankFormValueAdd.supplierGroup] = [];
        }
        labelTextsGrouped[bankFormValueAdd.supplierGroup].push(selectedFile.labelText);
      }
    }

    supplierBankData.forEach(bank => {
      const group = bank.supplierGroup;
      if (labelTextsGrouped[group]) {
        bank.LabelTextsV2 = { [group]: labelTextsGrouped[group] };
      }
    });

    if (supplierBankData.length > 0) {
      const supplierBankJson = JSON.stringify(supplierBankData);

      formData.append('supplierBankJson', supplierBankJson);

      formData.append('LabelTextsJson', JSON.stringify(labelTextsGrouped));

      try {
        await this.supplierService.addBankDataWithFiles(formData).toPromise();
      } catch (error) {
        console.error('Error sending data to backend:', error);
        Swal.fire('Error!', 'There was an error saving your data.', 'error');
      }
    } else {
      console.log('No valid form data to send.');
    }
  }

  private validateBankForms(): boolean {
    if (this.showSupplierBankForm && !this.isFormValidWithoutSupplierIdCompanyBank()) {
      Swal.fire('Warning!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return false;
    }
    if (this.showSupplierBankFormAdd && !this.isFormValidWithoutSupplierIdCompanyBankAdd()) {
      Swal.fire('Warning!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return false;
    }
    return true;
  }

  private handleInvalidForm(): void {
    this.supplierForm.markAllAsTouched();
    if (this.emailError !== '') {
      Swal.fire({
        icon: 'error',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
    } else {
      Swal.fire('Warning!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
    }
  }

  onUpdate(formValue: any): void {
    if (formValue && this.suppilerId) {
      const formData = this.prepareFormData();

      formData.forEach((value: any, key: string) => {
        if (value instanceof File) {
        } else {
        }
      });

      this.supplierService.updateDataWithFiles(this.suppilerId, formData).subscribe({
        next: (response) => {
          if (this.showSupplierBankForm === false) {
            this.insertLog();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Your data has been updated.',
              showConfirmButton: false,
              timer: 1500
            });
            this.sendEmailNotification();
            this.sendEmailNotificationRequester();
          } else {
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
            this.sendEmailNotificationRequester();
          }

          this.router.navigate(['/feature/supplier']);
        },
        error: (err) => {
          Swal.fire('Error!', 'There was an error saving your data.', 'error');
          console.error('Error updating data with files:', err);
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
      this.supplierBankForm.markAllAsTouched();
      Swal.fire('Warning!', 'กรุณาตรวจสอบข้อมูลของคุณให้ครบถ้วน', 'warning');
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

    const formData = new FormData();
    formData.append('Prefix', formValue.prefix);
    formData.append('Name', formValue.name);
    formData.append('Tax_Id', formValue.tax_Id);
    formData.append('AddressSup', formValue.addressSup);
    formData.append('District', formValue.district);
    formData.append('Subdistrict', formValue.subdistrict);
    formData.append('Province', formValue.province);
    formData.append('PostalCode', formValue.postalCode);
    formData.append('Tel', formValue.tel);
    formData.append('Email', formValue.email);
    formData.append('SupplierNum', formValue.supplierNum);
    formData.append('SupplierType', formValue.supplierType);
    formData.append('Site', formValue.site);
    formData.append('Vat', '-');
    formData.append('Status', formValue.status);
    formData.append('PaymentMethod', formValue.paymentMethod);
    formData.append('Company', formValue.company);
    formData.append('Type', formValue.type);
    formData.append('UserId', formValue.user_id);
    formData.append('Mobile', formValue.mobile);
    formData.append('groupName', 'SupplierFile');

    const labelTexts: string[] = [];
    const fileIds: number[] = [];

    for (let selectedFile of this.selectedFilesSupplier) {
      formData.append('Files', selectedFile.file, selectedFile.file.name);
      labelTexts.push(selectedFile.labelText);
    }

    for (let fileId of this.fileIdsToRemove) {
      fileIds.push(fileId);
    }

    formData.append('LabelTextsJson', JSON.stringify(labelTexts));
    formData.append('FileIdsJson', JSON.stringify(fileIds));

    return formData;
  }

  getSupplierType(): void {
    this.supplierService.getSupplierType().subscribe({
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

  async addBankData(form: FormGroup, selectedFiles: SelectedFile[]): Promise<void> {
    const formData = new FormData();

    if (form.valid) {
      const bankFormValue = form.value;

      const supplierBankJson = JSON.stringify(bankFormValue);
      formData.append('supplierBankJson', supplierBankJson);

      for (let selectedFile of selectedFiles) {
        formData.append('Files', selectedFile.file, selectedFile.file.name);
      }

      try {
        await this.supplierService.addBankDataWithFiles(formData).toPromise();

        await Swal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'Your data has been saved.',
          showConfirmButton: false,
          timer: 1500
        });

        this.router.navigate(['/feature/supplier']);

      } catch (error) {
        console.error('Error sending data to backend:', error);
        Swal.fire('Error!', 'There was an error saving your data.', 'error');
      }
    }
  }

  onUpdateSupplierBank(): void {
    const bankId = this.supplierBankForm.get('supbankId')?.value;
    console.log('1191', this.supplierBankForm.value);
    console.log('1192', this.suppilerId, this.supplierForm.value.company);
    this.supplierBankForm.patchValue({ supplierId: this.suppilerId, company: this.supplierForm.value.company });

    if (this.supplierBankForm.valid && this.suppilerId) {
      console.log('if');
      console.log('1191', this.supplierBankForm.value);
      const formData = this.prepareBankFormData(this.supplierBankForm.value);
      const bankId = this.supplierBankForm.get('supbankId')?.value;

      this.supplierService.updateBankDataWithFiles(bankId, formData).subscribe({
        next: (response) => {
          this.router.navigate(['/feature/supplier']);
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Your bank data has been updated successfully.',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => {
          console.error('Error updating bank data with files:', err);
          Swal.fire('Error!', 'There was an error updating your bank data.', 'error');
        }
      });
    }

    if (this.supplierBankFormAdd.valid && this.suppilerId) {
      const bankIdAdd = this.supplierBankFormAdd.get('supbankId')?.value;
      const formDataAdd = this.prepareBankFormData(this.supplierBankFormAdd.value);

      this.supplierService.updateBankDataWithFiles(bankIdAdd, formDataAdd).subscribe({
        next: (response) => {
          this.router.navigate(['/feature/supplier']);
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Your additional bank data has been updated successfully.',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => {
          Swal.fire('Error!', 'There was an error updating your additional bank data.', 'error');
          console.error('Error updating additional bank data with files:', err);
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
      this.supplierBankForm.markAllAsTouched();
      Swal.fire('Error!', 'There was an error saving your data.', 'error');
    }
  }

  prepareBankFormData(bankFormValue: any): FormData {
    const formData = new FormData();
    formData.append('SupbankId', bankFormValue.supbankId);
    formData.append('SupplierId', bankFormValue.supplierId);
    formData.append('NameBank', bankFormValue.nameBank);
    formData.append('Branch', bankFormValue.branch);
    formData.append('AccountNum', bankFormValue.accountNum);
    formData.append('SupplierGroup', bankFormValue.supplierGroup);
    formData.append('AccountName', bankFormValue.accountName);
    formData.append('Company', bankFormValue.company);

    const labelTexts: string[] = [];
    const filesToRemoveBank: number[] = this.fileIdsToRemoveBank

    for (let selectedFile of this.selectedNewFilesSupplier) {
      formData.append('Files', selectedFile.file, selectedFile.file.name);
      labelTexts.push(selectedFile.labelText);
    }

    const removedFileIdsString = filesToRemoveBank.join(', ');

    for (let fileId of filesToRemoveBank) {
      formData.append('FileIdsToRemove', fileId.toString());
    }

    formData.append('LabelTextsJson', JSON.stringify(labelTexts));
    formData.append('FileIdsString', JSON.stringify(filesToRemoveBank));

    formData.forEach((value, key) => {
      if (value instanceof File) {
      } else {
      }
    });
    return formData;
  }

  insertLog(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser) {
      console.error('Current user is not available in local storage');
      return;
    }

    if (this.showSupplierBankForm = true) {
      if (this.supplierForm.valid) {
        const log = {
          id: 0,
          userId: currentUser.userId || 0,
          username: currentUser.username || 'string',
          email: currentUser.email || 'string',
          status: this.supplierForm.get('status')?.value || 'Draft',
          customerId: 0,
          supplierId: this.isIDTemp || 0,
          time: new Date().toISOString(),
          rejectReason: this.reasonTemp
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
          customerId: 0,
          supplierId: this.supplierBankForm.get('supplier_id')?.value || 0,
          time: new Date().toISOString()
        };
        this.supplierService.insertLog(log).subscribe({
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
        if (this.isAdmin || this.isApproved) {
          this.filteredDataPaymentMethod = this.listOfPaymentMethod;
        } else {
          this.filteredDataPaymentMethod = this.listOfPaymentMethod.filter(type => ['Cheque', 'Transfer'].includes(type.paymentMethodName));
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
    this.validateEmail()
    if (this.emailError != '') {
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
    event.preventDefault();
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to save the changes?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, save it!'
    });
    if (result.isConfirmed) {
      if (this.suppilerId == null) {
        this.setStatusAndSubmit('Draft');
      } else {
        if (this.isApproved) {
          this.setStatusAndSubmit('Pending Approved By ACC');
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

  async approve(event: Event): Promise<void> {
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

  async checkApprove(event: Event) {
    try {
      this.supplierForm.value.supplierNum = '-'
      await this.CheckDupplicateData();
      await this.approve(event);
    } catch (error) {
      console.error('Error occurred:', error);
    }
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
            const subject = 'OnePortal Notification';
            const body = `
            <p>สถานะของ Supplier Number:${supplierNum}</p>
            <br>
            <p>ได้เปลี่ยนเป็น ${this.supplierForm.get('status')?.value} รบกวนเข้ามาดำเนินการตรวจสอบและ Approve ในลำดับต่อไป</p>
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
    else if (this.supplierForm.get('status')?.value === 'Approved By ACC' && !this.supplierBankForm.valid) {
      const company = this.supplierForm.get('company')?.value;
      this.supplierService.findApproversFNByCompany(company).subscribe(
        (approvers) => {
          approvers.forEach((approver: any) => {
            const to = approver.email;
            const subject = 'OnePortal Notification';
            const body = `
            <p>สถานะของ Supplier Number:${supplierNum}</p>
            <br>
            <p>ได้เปลี่ยนเป็น ${this.supplierForm.get('status')?.value} รบกวนเข้ามาดำเนินการตรวจสอบและ Approve ในลำดับต่อไป</p>
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
        supplierNum: '',
        site: '00000',
        supplierType: '-'
      });
    } else {
      this.isOneTime = false;
    }
  }

  CheckDupplicateData(): Promise<void> {
    this.isCheckingDuplicate = true;

    return new Promise((resolve, reject) => {
      if (!this.isFormValidWithoutSupplierNum()) {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          text: 'โปรดกรอกข้อมูลในฟอร์มให้ครบทุกช่องที่จำเป็น',
          confirmButtonText: 'ปิด'
        });
        this.isCheckingDuplicate = false;
        return reject('Form is not validxxx');
      }

      const foundItem = this.filteredDataType.find(item => item.code === this.supplierForm.value.supplierType);
      if (foundItem) {
        this.typeCode = foundItem.codeFrom;
      }

      const tax = this.supplierForm.value.tax_Id.trim();
      const type = this.typeCode.trim();
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
            this.isCheckingDuplicate = false;
            reject('Duplicate data found');
          } else {
            this.getNumMaxSupplier().then(() => {
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
            this.getNumMaxSupplier().then(() => {
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

  getNumMaxSupplier(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.supplierService.GetNumMaxSupplier(this.typeCode).subscribe({
        next: (response: any) => {
          if (!response || response.length === 0 || response.num === null) {
            this.supplierForm.patchValue({ supplierNum: '' });
          } else {
            const max = response.num;
            const maxStr = String(max);
            const matchResult = maxStr.match(/^(\d*[A-Za-z]+)(\d+)$/);
            const prefix = matchResult ? matchResult[1] : '';
            const numPart = matchResult ? matchResult[2] : '0';
            const nextNum = String(parseInt(numPart, 10) + 1).padStart(numPart.length, '0');
            const newCustomerNum = `${prefix}${nextNum}`;
            this.newSupnum = newCustomerNum;
            this.supplierForm.patchValue({ supplierNum: newCustomerNum });
            console.log(this.supplierForm.value);

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

  isFormValidWithoutSupplierNum(): boolean {
    const requiredFields = [
      'name', 'tax_Id', 'addressSup', 'district', 'subdistrict',
      'province', 'postalCode', 'tel', 'email', 'supplierType',
      'site', 'paymentMethod', 'company', 'type', 'mobile'
    ];

    for (const field of requiredFields) {
      if (!this.supplierForm.get(field)?.value) {
        return false;
      }
    }

    return true;
  }

  updateFilteredSupplierGroups(selectedGroup: string): void {
    this.filteredListOfGroup = this.listOfGroup.filter(group => {
      return group.group_name !== selectedGroup && group.group_name !== 'ALL Group';
    });

    this.supplierBankFormAdd.get('supplierGroup')?.setValue('');
  }

  isFormValidWithoutSupplierIdCompanyBank(): boolean {
    const requiredFields = [
      'accountName', 'accountNum', 'branch', 'nameBank',
    ];

    for (const field of requiredFields) {
      const value = this.supplierBankForm.get(field)?.value;
      if (!value) {
        return false;
      }
    }

    return true;
  }

  isFormValidWithoutSupplierIdCompanyBankAdd(): boolean {
    const requiredFields = [
      'accountName', 'accountNum', 'branch', 'nameBank',
    ];

    for (const field of requiredFields) {
      if (!this.supplierBankFormAdd.get(field)?.value) {
        return false;
      }
    }

    return true;
  }

  sendEmailNotificationRequester(): void {
    const supplierNum = this.supplierForm.get('supplierNum')?.value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const to = currentUser.email;
    const subject = 'OnePortal Notification';
    const body = `
        <p>สถานะของ Customer Number:${supplierNum}</p>
        <br>
        <p>ได้เปลี่ยนเป็น ${this.supplierForm.get('status')?.value} สามารถเข้ามาตรวจสอบได้ในระบบ</p>
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
}