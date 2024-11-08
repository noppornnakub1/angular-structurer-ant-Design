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
import { BehaviorSubject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { prefixService } from '../../../../shared/constants/prefix.service';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { ValidationService } from '../../../../shared/constants/ValidationService';
import { UserService } from '../../../user-manager/services/user.service';

export interface DataLocation {
  postId: number,
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
  file: File;
  fileType: string;
  fileName: string;
  filePath: string;
  labelText: string;
  fileId?: number;
  supbankId?: number;
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
  // providers: [PostCodeService],
  templateUrl: './supplier-add.component.html',
  styleUrl: './supplier-add.component.scss'
})

export class SupplierAddComponent {
  fileIdsToRemove: { SupbankId: number, FileId: number }[] = [];
  fileIdsToRemoveForBank: number[] = [];
  fileIdsToRemoveMapping: { SupbankId: number; FileId: number; IsNewUpload?: boolean }[] = [];
  fileIdsToRemoveJson: string = '';
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
  fileIdsToRemoveForBankJson: string = '';
  newSupnum: string = '';
  selectedFileSupplier: File | null = null;
  selectedFile: File | null = null;
  selectedFileAdd: File | null = null;
  fileIdsToRemoveForBankAdd: number[] = [];
  selectedFilesSupplier: SelectedFile[] = [];
  selectedNewFilesSupplier: SelectedFile[] = [];
  selectedFiles: SelectedFile[] = [];
  selectedFilesAdd: SelectedFile[] = [];
  anotherFileIdsToRemove: number[] = [];
  formData: FormData = new FormData();
  fileIdsToRemoveBank: number[] = [];
  fileIdsToRemoveBankAdd: number[] = [];
  private _cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService)
  listOfTypeVendor = [
    {
      title: 'Supplier',
    },
    {
      title: 'One Time',
    },
  ];
  files: any[] = [];
  listSupplierBankFileTemplates: any[] = [];
  filesBank = [
    { fileName: 'หนังสือยินยอมการโอนเงิน', fileType: '', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: '', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน' },
    { fileName: 'สำเนาหน้า Book Bank', fileType: '', filePath: '', labelText: 'สำเนาหน้า Book Bank' },
  ];
  filesBankAdd = [
    { fileName: 'หนังสือยินยอมการโอนเงิน', fileType: 'gchGroupConsentFile', filePath: '', labelText: 'หนังสือยินยอมการโอนเงิน' },
    { fileName: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน', fileType: 'gchGroupCertificationFile', filePath: '', labelText: 'หนังสือรับรองบริษัท / สำเนาบัตรประชาชน' },
    { fileName: 'สำเนาหน้า Book Bank', fileType: 'gchGroupBookBankFile', filePath: '', labelText: 'สำเนาหน้า Book Bank]' },
  ];
  private fileBankMapping: { [key: string]: { fileName: string; fileType: string; labelText: string; filePath: string }[] } = {};
  file: any;
  filess: Array<{ fileName: string; fileType: string; filePath: string; labelText: string; }> = [];
  displayFiles: Array<{ fileType: string; fileName: string; filePath: string; labelText: string; }> = [];
  displayFilesBank: Array<{ fileName: string, fileType: string, filePath: string, labelText?: string }> = [];
  displayFilesBankAdd: Array<{ fileName: string, fileType: string, filePath: string, labelText?: string }> = [];
  selectedPrefix: string = '';
  nameInput: string = '';
  fullName: string = '';
  isCheckingDuplicate: boolean = false;
  idreq: number = 0;
  selectedPostalCodeObject: any;
  selectedPostalCode: any = null;
  emailreq: string = '';
  fileBankAddApi: boolean = false;
  public isLoadingFromAPI = false;
  submittedFormLottoRisk$ = new BehaviorSubject<boolean>(false);
  userData:any;
  constructor(private _location: Location, private fb: FormBuilder
    , private supplierService: SupplierService,
    private router: Router,
    private route: ActivatedRoute,
    private postCodeService: PostCodeService,
    private cdr: ChangeDetectorRef,
    private bankMasterService: BankMasterService,
    private emailService: EmailService,
    private prefixService: prefixService,
    private validationService: ValidationService,
    private userService: UserService
  ) { }

  async ngOnInit(): Promise<void> {
    this.initializeForms();
    await this.handleRouteParams();
    this.initializeViewMode();
    this.loadStaticData();
    this.setupFormListeners();

    this.displayFiles = this.filess && this.filess.length > 0 ? this.filess : this.files;

    this.checkRole();
  }

  private initializeForms(): void {
    this.supplierForm = this.fb.group({
      id: [0], prefix: ['', Validators.required], name: ['', Validators.required],
      tax_Id: ['', Validators.required], addressSup: ['', Validators.required],
      postalCode: [null, Validators.required], province: [null , Validators.required], district: [null , Validators.required],
      subdistrict: [null , Validators.required], tel: ['', Validators.required], email: ['', Validators.required],
      supplierNum: [{ value: '', disabled: true }], supplierType: ['', Validators.required],
      site: ['00000', Validators.required], vat: [''], status: ['', Validators.required],
      paymentMethod: ['', Validators.required], company: ['', Validators.required],
      type: ['Supplier', Validators.required], userId: [''], mobile: ['', Validators.required],
      postId: ['']
    });

    this.supplierBankForm = this.createBankFormGroup();
    this.supplierBankFormAdd = this.createBankFormGroup();
  }

  private createBankFormGroup(): FormGroup {
    return this.fb.group({
      supbankId: [0], supplierId: [, Validators.required],
      nameBank: ['', Validators.required], branch: ['', Validators.required],
      accountNum: ['', Validators.required], supplierGroup: ['', Validators.required],
      accountName: ['', Validators.required], company: ['', Validators.required]
    });
  }

  private handleRouteParams(): Promise<void> {
    return new Promise((resolve) => {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.suppilerId = +id;
          forkJoin({
            supplierData: this.supplierService.findSupplierByIdV2(this.suppilerId),
            postCodes: this.postCodeService.getPostCodes()
          }).subscribe(({ supplierData, postCodes }) => {
            this.supplierForm.patchValue({
              ...supplierData,
              postalCode: supplierData.postalCode + '-' + supplierData.subdistrict
            });
            this.selectedPrefix = this.supplierForm.value.prefix
            this.items_provinces = postCodes;
            this.filteredItemsProvince = postCodes;
            if (this.supplierForm.value.postalCode && this.supplierForm.value.postId) {
              const merge = this.supplierForm.value.postalCode;
              this.onPostalCodeChange(merge);
            }
            resolve();
          });

          this.loadSupplierData(this.suppilerId);
          this.isIDTemp = this.suppilerId;
        } else {
          resolve();
        }
      });
    });
  }

  private initializeViewMode(): void {
    if (this.router.url.includes('/view/')) {
      this.isViewMode = true;
      this.supplierForm.disable();
      this.supplierBankForm.disable();
      this.supplierBankFormAdd.disable();
    }
  }

  private loadStaticData(): void {
    this.postCodeService.getPostCodes().subscribe(data => {
      this.items_provinces = data;
      this.filteredItemsProvince = data;
    });
    this.prefixService.getPrefix().subscribe(data => {
      this.item_prefix = data;
      this.filteredItemsPrefix = data;
    });
    this.getSupplierType();
    this.getDataBank();
    this.getDataPaymentMethod();
    this.getDataVAT();
    this.getDataCompany();
    this.GetSupplierFileTemplates();
    this.GetSupplierBankFileTemplates();
  }

  private setupFormListeners(): void {

    this.toggleSupplierBankForm(this.supplierForm.value.paymentMethod)
    this.supplierForm.get('supplierType')?.valueChanges.subscribe(value => {
      const supplierTypeId = this.getSupplierTypeId(value);

      if (supplierTypeId) {
        this.loadSupplierType(supplierTypeId);
      }
      this.onSupplierTypeChange(value);

      this._cdr.detectChanges();
    });

    this.supplierForm.get('paymentMethod')?.valueChanges.subscribe(value => this.toggleSupplierBankForm(value));
    this.supplierForm.get('name')?.valueChanges.subscribe((value: string) => {
      this.updateAccountNames(value);
    });
    this.supplierForm.get('prefix')?.valueChanges.subscribe(prefix => {
      this.selectedPrefix = prefix;
      this.updateNameWithPrefixChange();
      this._cdr.detectChanges();
    });

    this.supplierBankForm.get('supplierGroup')?.valueChanges.subscribe((selectedGroup: string) => {
      if (selectedGroup === 'ALL Group') {
        this.showSupplierBankFormAdd = false;
      }
      this.setFilesBank(selectedGroup, 'filesBank');
      this.updateFilteredSupplierGroups(selectedGroup);
    });

    this.supplierBankFormAdd.get('supplierGroup')?.valueChanges.subscribe(value => {
      if (!this.isLoadingFromAPI) {
        this.setFilesBank(value, 'filesBankAdd');
      }
    });
  }

  updateAccountNames(value: string): void {
    this.supplierBankForm.patchValue({ accountName: value });
    this.supplierBankFormAdd.patchValue({ accountName: value });
    this._cdr.detectChanges();
  }

  private mapFilesToGroups(): void {
    this.fileBankMapping = this.listSupplierBankFileTemplates.reduce((acc: { [key: string]: any[] }, file: any) => {
      if (!acc[file.groupName]) {
        acc[file.groupName] = [];
      }
      acc[file.groupName].push({
        fileName: file.fileName,
        fileType: file.fileType,
        labelText: file.labelText,
        filePath: file.filePath
      });
      return acc;
    }, {});
  }

  private setFilesBank(value: string, target: 'filesBank' | 'filesBankAdd'): void {
    if (this.fileBankMapping[value]) {
      this[target] = this.fileBankMapping[value];
    } else {
      this[target] = [];
    }
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

        const newFile: SelectedFile = {
          file: selectedFile,
          fileType: fileType,
          fileName: selectedFile.name,
          filePath: '',
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
        fileToUpdate = this.filesBankAdd.find(file => file.fileType === fileType && file.labelText === labelText) as SelectedFile | undefined;
      } else {
        fileToUpdate = this.filesBank.find(file => file.fileType === fileType && file.labelText === labelText) as SelectedFile | undefined;
      }

      if (fileToUpdate) {
        fileToUpdate.filePath = '';
        fileToUpdate.fileName = selectedFile.name;

        if (fileToUpdate && 'fileId' in fileToUpdate) {
          const fileId = fileToUpdate.fileId;
          if (fileId) {
            const supbankId = fileToUpdate.supbankId ?? (isFromFilesBankAdd ? this.supplierBankFormAdd.get('supbankId')?.value : this.supplierBankForm.get('supbankId')?.value);

            const existingEntry = this.fileIdsToRemoveMapping.find(entry => entry.SupbankId === supbankId && entry.FileId === fileId);

            if (existingEntry) {
              existingEntry.IsNewUpload = true;
            } else {
              this.fileIdsToRemoveMapping.push({
                SupbankId: supbankId,
                FileId: fileId,
                IsNewUpload: true
              });
            }

            if (isFromFilesBankAdd) {
              if (!this.fileIdsToRemoveBankAdd.includes(fileId)) {
                this.fileIdsToRemoveBankAdd.push(fileId);
              }
            } else {
              if (!this.fileIdsToRemoveBank.includes(fileId)) {
                this.fileIdsToRemoveBank.push(fileId);
              }
            }
          }
        }
      }

      const newFile: SelectedFile = {
        file: selectedFile,
        fileType: fileType,
        fileName: selectedFile.name,
        filePath: '',
        labelText: labelText
      };

      if (isFromFilesBankAdd) {
        this.selectedFilesAdd.push(newFile);
      } else {
        this.selectedNewFilesSupplier.push(newFile);
      }

      this._cdr.detectChanges();
    }
  }

  onFileSelect(event: Event, fileType: string, labelText: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];
      const newFile: SelectedFile = {
        file: selectedFile,
        fileType: fileType,
        fileName: selectedFile.name,
        filePath: '',
        labelText: labelText
      };
      this.selectedFiles.push(newFile);
    }
  }

  onFileSelectAdd(event: Event, fileType: string, labelText: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFilesAdd = [];
      for (let i = 0; i < input.files.length; i++) {
        const selectedFile = input.files[i];
        const newFile: SelectedFile = {
          file: selectedFile,
          fileType: fileType,
          fileName: selectedFile.name,
          filePath: '',
          labelText: labelText
        };
        this.selectedFilesAdd.push(newFile);
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

  onSiteBlur(): void {
    const nameControl = this.supplierForm.get('site');
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
      this.supplierForm.value.site = '00000'
      return;
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
    const numericValue = this.validationService.validateTaxId(input);
    this.supplierForm.patchValue({ taxId: numericValue });
    event.target.value = numericValue;
  }

  validateTel(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTel(input);
    event.target.value = numericValue;
    this.supplierForm.patchValue({ tel: numericValue });
  }

  validateMobile(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateTel(input);
    event.target.value = numericValue;
    this.supplierForm.patchValue({ mobile: numericValue });
  }

  validateSite(event: any): void {
    const input = event.target.value;
    const numericValue = this.validationService.validateSite(input);
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
    this.getGruopName();
    this.showSupplierBankForm = this.paymentMethods.includes(value);

    if (this.showSupplierBankForm) {
      this.supplierBankForm.patchValue({ accountName: this.supplierForm.value.name });
    }
    this._cdr.detectChanges();
  }

  showBankCopy() {
    this.showSupplierBankFormAdd = true;
    if (this.showSupplierBankFormAdd) {
      this.updateFilteredSupplierGroups(this.supplierBankForm.value.supplierGroup)
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

  removeFile(file: any, isForBank: boolean = false): void {
    if (file.fileId) {
      const supbankId = file.supbankId || (isForBank ? this.supplierBankForm.get('supbankId')?.value : this.supplierBankFormAdd.get('supbankId')?.value);
      console.log();
      
      if (isForBank) {
        this.fileIdsToRemoveForBank.push(file.fileId);
      } else {
        this.fileIdsToRemove.push(file.fileId);
      }

      if (!this.fileIdsToRemoveMapping.find(item => item.FileId === file.fileId && item.SupbankId === supbankId)) {
        this.fileIdsToRemoveMapping.push({ SupbankId: supbankId, FileId: file.fileId });
      }
      console.log(this.fileIdsToRemoveMapping);
      
      file.filePath = '';
      file.fileName = '';

      if (!isForBank) {
        this.selectedFilesSupplier = this.selectedFilesSupplier.filter(f => f.fileType !== file.fileType || f.labelText !== file.labelText);
      } else {
        this.selectedNewFilesSupplier = this.selectedNewFilesSupplier.filter(f => f.fileType !== file.fileType || f.labelText !== file.labelText);
      }

      this.fileIdsToRemoveJson = JSON.stringify(this.fileIdsToRemoveMapping.filter(item => !isForBank));
      this.fileIdsToRemoveForBankJson = JSON.stringify(this.fileIdsToRemoveMapping.filter(item => isForBank));

      this._cdr.detectChanges();
    }
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
      this.idreq = data.userId
      if (data.supplierFiles && data.supplierFiles.length > 0) {
        this.filess = data.supplierFiles.map((file: any) => ({
          fileId: file.fileId,
          fileName: file.fileName,
          fileType: file.fileType,
          filePath: file.filePath,
          labelText: file.labelText || ''
        }));
        const missingFiles = this.files.filter(file => {
          const existingFile = this.filess.find(f => f.labelText === file.labelText);
          return !existingFile || !existingFile.filePath;
        });
        this.displayFiles = [...this.filess, ...missingFiles];

      } else {
        this.displayFiles = this.files;
      }

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
        if (bankData.supplierGroup && !this.listOfGroup.some(group => group.group_name === bankData.supplierGroup)) {
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
        this.selectedSupplierGroup = this.supplierBankForm.value.supplierGroup

        this.showSupplierBankForm = true;
      }

      if (data.supplierBankFilesForSupbankId1 && data.supplierBankFilesForSupbankId1.length > 0) {
        this.filesBank = data.supplierBankFilesForSupbankId1.map((file: any) => ({
          fileId: file.FileId,
          supbankId: file.SupbankId,
          fileName: file.FileName,
          fileType: file.FileType,
          filePath: file.FilePath,
          labelText: file.LabelText
        }));
      }


      if (data.supplierBank.length > 1) {
        const bankDataAdd = data.supplierBank[1];
        this.isLoadingFromAPI = true;
        this.selectedSupplierGroupAdd = bankDataAdd.SupplierGroup;

        this.supplierBankFormAdd.patchValue({
          supbankId: bankDataAdd.SupbankId,
          supplierId: bankDataAdd.SupplierId,
          nameBank: bankDataAdd.NameBank,
          branch: bankDataAdd.Branch,
          accountNum: bankDataAdd.AccountNum,
          supplierGroup: bankDataAdd.SupplierGroup,
          accountName: bankDataAdd.AccountName,
          company: bankDataAdd.Company
        });

        this.showSupplierBankFormAdd = true;
        this._cdr.detectChanges();
        setTimeout(() => {
          this.isLoadingFromAPI = false;
        }, 1000);
      }

      if (data.supplierBankFilesForSupbankId2 && data.supplierBankFilesForSupbankId2.length > 0) {
        this.filesBankAdd = data.supplierBankFilesForSupbankId2.map((file: any) => ({
          fileId: file.FileId,
          supbankId: file.SupbankId,
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
        if (this.supplierForm.value.company === '') {
          this.supplierForm.patchValue({
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
        else {
          this.supplierForm.patchValue({
            postalCode: '-',
            province: '-',
            district: '-',
            subdistrict: '-',
            site: '',
            vat: '-',
            paymentMethod: '-'
          });
        }
      }
    });
  }

  getSupplierTypeId(code: string): number | undefined {
    const type = this.listOfType.find(t => t.code === code);
    return type ? type.id : undefined;
  }

  onSearch(value: string): void {
    if (value) {
      this.filteredItemsProvince = this.items_provinces.filter(item =>
        item.postalCode.includes(value) ||
        item.subdistrict.includes(value) ||
        item.district.includes(value) ||
        item.province.includes(value)
      );
    } else {
      this.filteredItemsProvince = [...this.items_provinces];
    }
  }

  onPostalCodeChange(value: any): void {
    let selectedItemId: any;
    let selectedItem: any;
    const [postalCode, subdistrict] = value.split('-');
    const potalCodeold = this.supplierForm.value.postalCode
    const postId = this.supplierForm.value.postId
    const district = this.supplierForm.value.district
    const province = this.supplierForm.value.province
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

      this.supplierForm.patchValue({
        postalCode: selectedItemId.postalCode + '-' + selectedItemId.subdistrict
      });
    }
    else if (selectedItem) {
      this.supplierForm.patchValue({
        district: selectedItem.district,
        subdistrict: selectedItem.subdistrict,
        province: selectedItem.province,
        postId: selectedItem.postId
      });
      this.cdr.markForCheck();
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
      const formData = this.prepareFormAddData();
      console.log(formData);
      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });

      if (this.suppilerId) {
        await this.onUpdate(formData);
      } else {
        this.supplierService.addOrUpdateSupplierWithBankAndFiles(formData).subscribe({
          next: (response) => {
            if (response) {
              // this.handleAddResponse(response);
              this.insertLog();
              Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Your data has been saved.',
                showConfirmButton: false,
                timer: 1500
              });
        
              this.router.navigate(['/feature/supplier']);
            }
          },
          error: (err) => {
            console.error('Error adding supplier data:', err);
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

  private async handleAddResponse(response: any): Promise<void> {
    if (response && response.supplier_id) {
      this.updateSupplierBankForm(response);

      await this.handleBankForms();

      await this.insertLog();

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
      bankFormValue.supplierId = bankFormValue.supplierId || 0;
      mainSupplierId = bankFormValue.supplierId;
      mainCompany = bankFormValue.company;

      supplierBankData.push(bankFormValue);

      this.selectedNewFilesSupplier.forEach(selectedFile => {
        formData.append('Files', selectedFile.file, selectedFile.file.name);
        if (!labelTextsGrouped[bankFormValue.supplierGroup]) {
          labelTextsGrouped[bankFormValue.supplierGroup] = [];
        }
        labelTextsGrouped[bankFormValue.supplierGroup].push(selectedFile.labelText);
      });
    }

    if (this.showSupplierBankFormAdd) {
      const bankFormValueAdd = this.supplierBankFormAdd.value;
      bankFormValueAdd.supplierId = bankFormValueAdd.supplierId || mainSupplierId || 0;
      bankFormValueAdd.company = bankFormValueAdd.company || mainCompany;
      supplierBankData.push(bankFormValueAdd);

      this.selectedFilesAdd.forEach(selectedFile => {
        formData.append('Files', selectedFile.file, selectedFile.file.name);
        if (!labelTextsGrouped[bankFormValueAdd.supplierGroup]) {
          labelTextsGrouped[bankFormValueAdd.supplierGroup] = [];
        }
        labelTextsGrouped[bankFormValueAdd.supplierGroup].push(selectedFile.labelText);
      });
    }

    supplierBankData.forEach(bank => {
      const group = bank.supplierGroup;
      if (labelTextsGrouped[group]) {
        bank.LabelTextsV2 = { [group]: labelTextsGrouped[group] };
      }
    });

    if (supplierBankData.length > 0) {
      formData.append('supplierBankJson', JSON.stringify(supplierBankData));
      formData.append('LabelTextsJson', JSON.stringify(labelTextsGrouped));

      try {
        await this.supplierService.saveSupplierBanksWithFiles(formData).toPromise();
      } catch (error) {
        console.error('Error sending data to backend:', error);
        Swal.fire('Error!', 'There was an error saving your data.', 'error');
      }
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
        icon: 'warning',
        title: 'Email ไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
        confirmButtonText: 'ปิด'
      });
    } else {
      Swal.fire('Warning!', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
    }
  }

  private showSuccessNotification(): void {
    Swal.fire({
      icon: 'success',
      title: 'Updated!',
      text: 'Your data has been updated.',
      showConfirmButton: false,
      timer: 1500
    });
    const status = this.supplierForm.value.status;
    if (this.isApproved && status === 'Pending Approved By ACC') {
      this.router.navigate([`/feature/supplier/view/${this.suppilerId}`]);
    } else {
      this.router.navigate(['/feature/supplier']);
    }
  }

  private handleUpdateResponse(): void {
    if (!this.showSupplierBankForm) {
      this.insertLog();
      this.sendEmailNotification();
      this.sendEmailNotificationRequester();
    } else {
      this.onUpdateSupplierBank();
      this.insertLog();
      this.sendEmailNotification();
      this.sendEmailNotificationRequester();
    }

    const status = this.supplierForm.value.status;
    if (this.isApproved && status === 'Pending Approved By ACC') {
      this.router.navigate([`/feature/supplier/view/${this.suppilerId}`]);
    } else {
      this.router.navigate(['/feature/supplier']);
    }
  }

  onUpdate(formValue: any): void {
    if (formValue && this.suppilerId) {
      const formData = this.prepareFormAddData();
      console.log(formData);
      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });
      const fileIdsToRemoveJson = JSON.stringify(this.fileIdsToRemove);
      formData.append('fileIdsToRemoveJson', fileIdsToRemoveJson);

      this.supplierService.addOrUpdateSupplierWithBankAndFiles(formData).subscribe({
        next: (response) => {
          // this.handleUpdateResponse();
          this.insertLog();
          this.showSuccessNotification();
          this.sendEmailNotification();
          this.sendEmailNotificationRequester();
        },
        error: (err) => {
          Swal.fire('Error!', 'There was an error Update your data.', 'error');
          console.error('Error updating data with files:', err);
        }
      });
    } else {
      this.supplierForm.markAllAsTouched();
      this.supplierBankForm.markAllAsTouched();
      Swal.fire('Warning!', 'กรุณาตรวจสอบข้อมูลของคุณให้ครบถ้วน', 'warning');
    }
  }

  prepareFormData(): FormData {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser || !currentUser.userId) {
      console.error('Current user is not available in local storage');
      return new FormData();
    }

    const formValue = { ...this.supplierForm.value };
    const postalCode = formValue.postalCode.split('-')[0];
    formValue.postalCode = postalCode

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
    formData.append('SupplierNum', formValue.supplierNum || '');
    formData.append('SupplierType', formValue.supplierType);
    formData.append('Site', formValue.site);
    formData.append('Vat', formValue.vat);
    formData.append('Status', formValue.status);
    formData.append('PaymentMethod', formValue.paymentMethod);
    formData.append('Company', formValue.company);
    formData.append('Type', formValue.type);
    formData.append('UserId', formValue.user_id);
    formData.append('Mobile', formValue.mobile);
    formData.append('PostId', formValue.postId);
    formData.append('groupName', 'SupplierFile');

    const fileIdsToRemove = this.fileIdsToRemove || [];
    formData.append('fileIdsToRemoveJson', JSON.stringify(fileIdsToRemove));

    const labelTexts: string[] = [];
    const fileIds: number[] = [];

    for (let selectedFile of this.selectedFilesSupplier) {
      formData.append('Files', selectedFile.file, selectedFile.file.name);
      labelTexts.push(selectedFile.labelText);
    }

    for (let file of this.fileIdsToRemove) {
      if (file.FileId !== undefined) {
        fileIds.push(file.FileId);
      }
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

  onUpdateSupplierBank(): void {
    const supplierBankData: any[] = [];
    const company = this.supplierForm.value.company;

    if (this.supplierBankFormAdd.invalid && this.supplierBankForm.valid) {
      if (!this.supplierBankFormAdd.value.supplierId) {
        this.supplierBankFormAdd.patchValue({ supplierId: this.isIDTemp, company });
      }
    }

    if (this.supplierBankForm.valid) {
      supplierBankData.push(this.supplierBankForm.value);
    }

    if (this.supplierBankFormAdd.valid) {
      supplierBankData.push(this.supplierBankFormAdd.value);
    }

    if (supplierBankData.length > 0) {
      const formData = new FormData();
      formData.append('supplierBankJson', JSON.stringify(supplierBankData));

      formData.append('fileIdsToRemoveForBankJson', this.fileIdsToRemoveForBankJson);
      formData.append('fileIdsToRemoveJson', this.fileIdsToRemoveForBankJson);

      const labelTextsGrouped: { [key: string]: string[] } = {};
      [...this.selectedNewFilesSupplier, ...this.selectedFilesAdd].forEach(selectedFile => {
        if (!labelTextsGrouped[selectedFile.fileType]) {
          labelTextsGrouped[selectedFile.fileType] = [];
        }
        labelTextsGrouped[selectedFile.fileType].push(selectedFile.labelText);
      });

      formData.append('LabelTextsJson', JSON.stringify(labelTextsGrouped));

      [...this.selectedNewFilesSupplier, ...this.selectedFilesAdd].forEach(selectedFile => {
        formData.append('Files', selectedFile.file, selectedFile.file.name);
      });

      this.supplierService.saveSupplierBanksWithFiles(formData).subscribe({
        next: () => Swal.fire('Success!', 'Your bank data has been updated successfully.', 'success'),
        error: (err) => {
          Swal.fire('Error!', 'There was an error updating your bank data.', 'error');
          console.error('Error updating bank data with files:', err);
        }
      });
    } else {
      this.supplierBankForm.markAllAsTouched();
      this.supplierBankFormAdd.markAllAsTouched();
      Swal.fire('Error!', 'Please fill in all required fields.', 'error');
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
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 7);
        const log = {
          id: 0,
          userId: currentUser.userId || 0,
          username: currentUser.username || 'string',
          email: currentUser.email || 'string',
          status: this.supplierForm.get('status')?.value || 'Draft',
          customerId: 0,
          supplierId: this.isIDTemp || 0,
          time: currentDate,
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

  getGruopName(): void {
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
    // if (this.emailError != '') {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Email ไม่ถูกต้อง',
    //     text: 'โปรดตรวจสอบให้แน่ใจว่า Email ของคุณถูกต้อง',
    //     confirmButtonText: 'ปิด'
    //   });
    //   return;
    // }
    if (this.showSupplierBankForm && !this.isFormValidWithoutSupplierIdCompanyBank()) {
      await Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่าคุณได้กรอกข้อมูล Bank ครบแล้ว',
        confirmButtonText: 'ปิด'
      });
      this.submittedFormLottoRisk$.next(true);
      return;
    }
    if (this.showSupplierBankFormAdd && !this.isFormValidWithoutSupplierIdCompanyBankAdd()) {
      this.submittedFormLottoRisk$.next(true);
      await Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'โปรดตรวจสอบให้แน่ใจว่าคุณได้กรอกข้อมูล Bank ครบแล้ว',
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
      else if (result.dismiss === Swal.DismissReason.cancel) {
        this.supplierForm.patchValue({ supplierNum: '' });
        Swal.fire({
          icon: 'info',
          title: 'Cancelled',
          text: 'Your Supplier number has been cleared.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  async checkApprove(event: Event) {
    try {
      this.supplierForm.value.supplierNum = '-'
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
            const newStatus = currentStatus === 'Approved By ACC' ? 'Pending Approved By ACC' : 'Reject By ACC';
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
    const supplierName = this.supplierForm.get('name')?.value;
    const TaxID = this.supplierForm.get('tax_Id')?.value;
    console.log(this.supplierForm);
    var name = '';
    this.userService.findUserById(this.idreq).subscribe((data: any) => {
      name = data.firstname
      this._cdr.markForCheck();
    });
    if (this.supplierForm.get('status')?.value === 'Pending Approved By ACC' && this.supplierBankForm.valid == false) {
      const company = this.supplierForm.get('company')?.value;
      this.supplierService.findApproversByCompany(company).subscribe(
        (approvers) => {
          approvers.forEach((approver: any) => {
            const to = approver.email;
            const subject = 'OnePortal Notification';
            const body = `
            <p>เรียน ส่วนงานบัญชี</p>
            <br>
            <p>เรื่อง : คำขอเปิด Supplier ใหม่</p>
            <br>
            <p>มีคำขอเปิด Supplier ใหม่ จาก คุณ ${name} </p>
            <br>
            <p>เราได้รับคำขอเปิด Supplier: ${supplierName} Tax ID:${TaxID} ของคุณแล้ว</p>
            <br>
            <p>สถานะคำขอของคุณ: ${this.supplierForm.get('status')?.value} </p>
            <br>
            <p>คุณสามารถติดตามสถานะคำขอของคุณได้ที่ <a>http://10.10.0.28:8085/</a></p>
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
    }
    else if (this.supplierForm.get('status')?.value === 'Approved By ACC' && !this.supplierBankForm.valid) {
      const company = this.supplierForm.get('company')?.value;
      this.supplierService.findApproversFNByCompany(company).subscribe(
        (approvers) => {
          approvers.forEach((approver: any) => {
            const to = approver.email;
            const subject = 'OnePortal Notification';
            const body = `
            <p>เรียน ส่วนงานการเงิน</p>
            <br>
            <p>เราได้รับคำขอเปิด Supplier: ${supplierName} Tax ID:${TaxID} ของคุณได้รับการอนุมัติจากบัญชีแล้ว</p>
            <br>
            <p>สถานะคำขอของคุณ: ${this.supplierForm.get('status')?.value}</p>
            <br>
            <p>คุณสามารถติดตามสถานะคำขอของคุณได้ที่ <a>http://10.10.0.28:8085/</a></p>
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

  isFormValidBank(): boolean {
    const requiredFields = [
      'supplierGroup', 'nameBank', 'branch', 'accountNum', 'accountName',
    ];

    for (const field of requiredFields) {
      if (!this.supplierBankForm.get(field)?.value) {
        return false;
      }
    }

    return true;
  }

  isFormValidBankAdd(): boolean {
    const requiredFields = [
      'supplierGroup', 'nameBank', 'branch', 'accountNum', 'accountName',
    ];

    for (const field of requiredFields) {
      if (!this.supplierBankFormAdd.get(field)?.value) {
        return false;
      }
    }

    return true;
  }

  updateFilteredSupplierGroups(selectedGroup: string): void {
    if (this.showSupplierBankFormAdd) {
      this.listOfGroup = this.listOfGroup.filter(group => {
        return group.group_name !== selectedGroup && group.group_name !== 'ALL Group';
      });
    }
    this.supplierBankFormAdd.get('supplierGroup')?.setValue('');
  }

  isFormValidWithoutSupplierIdCompanyBank(): boolean {
    const requiredFields = [
      'supplierGroup', 'accountName', 'accountNum', 'branch', 'nameBank',
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
      'supplierGroup', 'accountName', 'accountNum', 'branch', 'nameBank',
    ];

    for (const field of requiredFields) {
      if (!this.supplierBankFormAdd.get(field)?.value) {
        return false;
      }
    }

    return true;
  }

  sendEmailNotificationRequester(): void {
    const status = this.supplierForm.get('status')?.value;
    var to = ''
    var subject = ''
    var body = ''
    this.userService.findUserById(this.idreq).subscribe((data: any) => {
      this.userData = data
      console.log(this.userData);
      console.log(status);
      console.log(this.userData.firstname,this.userData.email);
      if (status === 'Pending Approved By ACC') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : คำขอเปิด Supplier ใหม่</p>
        <br>
        <p>คำขอเปิด Supplier ใหม่ ของท่าน ส่งให้ส่วนงานบัญชีเรียบร้อยแล้ว</p>
        <br>
        <p>Supplier Name : ${this.supplierForm.get('name')?.value}</p>
        <p>Tax ID : ${this.supplierForm.get('tax_Id')?.value} </p>
        <p>Type: ${this.supplierForm.get('supplierType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a>http://10.10.0.28:8085/feature/supplier/view/${this.supplierForm.get('id')?.value}</a></p>
        <br>
        <p>หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้ที่บัญชี [เบอร์กลางบัญชี]</p>
        <p>หรือหากพบเจอปัญหาของระบบ สามารถติดต่อ IT #9432</p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      else if (status === 'Approved By ACC' || status === 'Reject By ACC') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : มีการเปลี่ยนแปลงสถานะคำขอเปิด Supplier ของท่าน</p>
        <br>
        <p>คำขอ Supplier ของท่าน ${status} โดยส่วนงานบัญชี</p>
        <br>
        <p>Supplier Name : ${this.supplierForm.get('name')?.value}</p>
        <p>Tax ID : ${this.supplierForm.get('tax_Id')?.value} </p>
        <p>Type: ${this.supplierForm.get('supplierType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a>http://10.10.0.28:8085/feature/supplier/view/${this.supplierForm.get('id')?.value}</a></p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      else if (status === 'Reject By FN') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : มีการเปลี่ยนแปลงสถานะคำขอเปิด Supplier ของท่าน</p>
        <br>
        <p>คำขอ Supplier ของท่าน ${status} โดยส่วนงานการเงิน</p>
        <br>
        <p>Supplier Name : ${this.supplierForm.get('name')?.value}</p>
        <p>Tax ID : ${this.supplierForm.get('tax_Id')?.value} </p>
        <p>Type: ${this.supplierForm.get('supplierType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a>http://10.10.0.28:8085/feature/supplier/view/${this.supplierForm.get('id')?.value}</a></p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      else if (status === 'Approved By FN') {
        to = this.userData.email;
        subject = 'OnePortal Notification';
        body = `
        <p>เรียน คุณ${this.userData.firstname}</p>
        <br>
        <p>เรื่อง : มีการเปลี่ยนแปลงสถานะคำขอเปิด Supplier ของท่าน</p>
        <br>
        <p>คำขอ Supplier ของท่าน ได้รับการอนุมัติ เรียบร้อยแล้ว อยู่ระหว่างการนำข้อมูลเข้าระบบ ERP Oracle </p>
        <br>
        <p>Supplier Number : ${this.supplierForm.get('supplierNum')?.value}</p>
        <p>Supplier Name : ${this.supplierForm.get('name')?.value}</p>
        <p>Tax ID : ${this.supplierForm.get('tax_Id')?.value} </p>
        <p>Type: ${this.supplierForm.get('supplierType')?.value} </p>
        <br>
        <p>ท่านสามารถติดตามสถานะคำขอของท่าน ได้ที่ <a>http://10.10.0.28:8085/feature/supplier/view/${this.supplierForm.get('id')?.value}</a></p>
        <br>
        <p>Best Regards</p>
        <p>OnePortal</p>
        <p>กลุ่มบริษัท เดอะ วัน เอ็นเตอร์ไพรส์ จำกัด (มหาชน)</p>`;
      }
      this.emailService.sendEmail(to, subject, body).subscribe(
        (response) => {
          console.log(response); 
        },
        (error) => {
          console.error('Error sending email', error);
        }
      );
      this._cdr.markForCheck();
    });
  }

  checkAndCallApi(): void {
    const supplierType = this.supplierForm.get('supplierType')?.value;
    const taxId = this.supplierForm.get('tax_Id')?.value;
    const userId = this.supplierForm.get('id')?.value;
    if ((supplierType && taxId) && userId == 0) {
      const formData = {
        taxId: taxId,
        supplierType: supplierType
      };
      this.supplierService.CheckDuplicateSupplierByTaxIdAndType(formData).subscribe({
        next: (response: string) => {
          if (response.includes('No duplicate supplier found')) {
          }
          this._cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error occurred:', err);
          Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลซ้ำ',
            text: err,
            confirmButtonText: 'ปิด'
          });
          this.supplierForm.patchValue({ tax_Id: ' ' });
          this._cdr.detectChanges();
        }
      });
    }
  }

  getMaxSupplierNum(): void {
    this.supplierService.GetMaxSupplierNum().subscribe({
      next: (response: any) => {
      },
      error: () => {
      }
    });
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  GetSupplierFileTemplates(): void {
    this.supplierService.GetSupplierFileTemplates().subscribe({
      next: (response: any) => {
        this.files = response.map((file: any) => ({
          fileName: file.fileName,
          fileType: file.fileType,
          filePath: file.filePath,
          labelText: file.labelText
        }));
        this.displayFiles = this.filess && this.filess.length > 0 ? this.filess : this.files;
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  GetSupplierBankFileTemplates(): void {
    this.supplierService.GetSupplierBankFileTemplates().subscribe({
      next: (response: any) => {
        this.listSupplierBankFileTemplates = response.map((file: any) => ({
          templateId: file.templateId,
          groupName: file.groupName,
          fileName: file.fileName,
          fileType: file.fileType,
          filePath: file.filePath,
          labelText: file.labelText
        }));
        this.mapFilesToGroups();
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  prepareFormAddData(): FormData {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser || !currentUser.userId) {
      console.error('Current user is not available in local storage');
      return new FormData();
    }
    console.log('2187',currentUser.userId);
    
    const formValue = { ...this.supplierForm.value };
    formValue.postalCode = formValue.postalCode.split('-')[0];
    formValue.UserId = currentUser.userId;

    const formData = new FormData();
    formData.append('groupName', 'SupplierFile');
    formData.append('fileIdsToRemoveJson', JSON.stringify(this.fileIdsToRemove || []));
    const SupplierFilesMetadata: { supplierGroup: string, fileName: string, labelText: string }[] = [];
    const labelTexts: string[] = [];
    for (const selectedFile of this.selectedFilesSupplier) {
      formData.append('SupplierFiles', selectedFile.file, selectedFile.file.name);
      SupplierFilesMetadata.push({
        supplierGroup: 'SupplierFile',
        fileName: selectedFile.file.name,
        labelText:selectedFile.labelText
      });
      labelTexts.push(selectedFile.labelText);  
    }

    const fileIds = (this.fileIdsToRemove || []).map(file => file.FileId).filter(id => id !== undefined);
    const filesToRemoveBank: number[] = this.fileIdsToRemoveBank
    console.log(this.fileIdsToRemoveForBankJson);
    console.log(this.fileIdsToRemoveJson);
    
    
    const supplierBankData = [];
    let mainSupplierId: number | undefined;
    let mainCompany: string | undefined;
    const labelTextsGrouped: { [key: string]: string[] } = {};
    const supplierBankFilesMetadata: { supplierGroup: string, fileName: string, labelText: string }[] = [];
   

    if (this.showSupplierBankForm) {
      const bankFormValue = { ...this.supplierBankForm.value };
      bankFormValue.supplierId = bankFormValue.supplierId || 0;
      mainSupplierId = bankFormValue.supplierId;
      mainCompany = bankFormValue.company;

      supplierBankData.push(bankFormValue);

      this.selectedNewFilesSupplier.forEach(selectedFile => {
        formData.append('SupplierBankFiles', selectedFile.file, selectedFile.file.name);
  
        supplierBankFilesMetadata.push({
          supplierGroup: bankFormValue.supplierGroup,
          fileName: selectedFile.file.name,
          labelText:selectedFile.labelText
        });

        if (!labelTextsGrouped[bankFormValue.supplierGroup]) {
          labelTextsGrouped[bankFormValue.supplierGroup] = [];
        }
        labelTextsGrouped[bankFormValue.supplierGroup].push(selectedFile.labelText);
      });
    }

    if (this.showSupplierBankFormAdd) {
      const bankFormValueAdd = { ...this.supplierBankFormAdd.value };
      bankFormValueAdd.supplierId = bankFormValueAdd.supplierId || mainSupplierId || 0;
      bankFormValueAdd.company = bankFormValueAdd.company || mainCompany;

      supplierBankData.push(bankFormValueAdd);

      this.selectedFilesAdd.forEach(selectedFile => {
        formData.append('SupplierBankFiles', selectedFile.file, selectedFile.file.name);

        supplierBankFilesMetadata.push({
          supplierGroup: bankFormValueAdd.supplierGroup,
          fileName: selectedFile.file.name,
          labelText:selectedFile.labelText
        });

        if (!labelTextsGrouped[bankFormValueAdd.supplierGroup]) {
          labelTextsGrouped[bankFormValueAdd.supplierGroup] = [];
        }
        labelTextsGrouped[bankFormValueAdd.supplierGroup].push(selectedFile.labelText);
      });
    }

    supplierBankData.forEach(bank => {
      const group = bank.supplierGroup;
      if (labelTextsGrouped[group]) {
        bank.LabelTextsV2 = { [group]: labelTextsGrouped[group] };
      }
    });

    for (let fileId of filesToRemoveBank) {
      formData.append('FileIdsToRemove', fileId.toString());
    }

    formData.append('supplierJson', JSON.stringify(formValue));
    formData.append('supplierBankJson', JSON.stringify(supplierBankData));
    formData.append('fileIdsToRemoveJson', JSON.stringify(fileIds));
    formData.append('fileBankIdsToRemoveJson', this.fileIdsToRemoveForBankJson);
    formData.append('SupplierBankFilesMetadata', JSON.stringify(supplierBankFilesMetadata));
    formData.append('SupplierFilesMetadata', JSON.stringify(SupplierFilesMetadata));
    return formData;
  }

  isFieldValidSupplier(field: string): boolean {
    const control = this.supplierForm.get(field);
    return !!control?.invalid && (!!control?.touched || (!!control?.untouched && this.submittedFormLottoRisk$.value));
  }

  isFieldValidSupplierBank(field: string): boolean {
    const control = this.supplierBankForm.get(field);
    return !!control?.invalid && (!!control?.touched || (!!control?.untouched && this.submittedFormLottoRisk$.value));
  }

  isFieldValidSupplierBankAdd(field: string): boolean {
    const control = this.supplierBankFormAdd.get(field);
    return !!control?.invalid && (!!control?.touched || (!!control?.untouched && this.submittedFormLottoRisk$.value));
  }

  onEnterKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault(); // ป้องกันการทำงานแบบเดิมของ Enter
      const form = event.target as HTMLInputElement;
  
      // ค้นหา element ถัดไป
      const nextElement = form.nextElementSibling as HTMLElement | null;
  
      if (nextElement) {
        // ถ้ามี element ถัดไป ให้โฟกัสที่มัน
        nextElement.focus();
      } else {
        // ถ้าไม่มี element ถัดไป ให้ย้ายไปที่ฟิลด์แรกในฟอร์ม
        const firstElement = form.closest('form')?.querySelector('input');
        firstElement?.focus();
      }
    }
  }

}

