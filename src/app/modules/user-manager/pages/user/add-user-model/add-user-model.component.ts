import { Component, EventEmitter, Output, OnInit, Input, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ReactiveFormsModule } from '@angular/forms';
import { DataCompany } from '../../../../supplier/pages/supplier-add/supplier-add.component';
import { SupplierService } from '../../../../supplier/services/supplier.service';
import { UserService } from '../../../services/user.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ModalDataService } from '../../../../../shared/constants/ModalDataService';
import { RoleService } from '../../../services/role.service';
import { IRole } from '../../../interface/role.interface';
import { IUserResponsible } from '../../../interface/response-type.interface';

@Component({
  selector: 'app-add-user-model',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
  ],
  templateUrl: './add-user-model.component.html',
  styleUrls: ['./add-user-model.component.scss']
})
export class AddUserModelComponent implements OnInit {

  @Input() isVisible = false;
  @Output() handleOk = new EventEmitter<any>();
  @Output() handleCancel = new EventEmitter<void>();
  @Input() modalInstance!: NzModalRef;
  @Input() userId!: number;
  listOfCompany: DataCompany[] = [];
  filteredDataompany: DataCompany[] = [];
  listOfRole: IRole[] = [];
  filteredDataRole: IRole[] = [];
  listOfDataUserResponsible: IUserResponsible[] = [];
  filteredDataUserResponsible: IUserResponsible[] = [];
  validateForm!: FormGroup;
  listOfActive = [
    {
      title: 'Active',
      value: 1
    },
    {
      title: 'InActive',
      value: 0
    },
  ];
  CheckRole = 0;
  private _cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder,
    private supplierService: SupplierService,
    private userService: UserService,
    private router: Router,
    private modalDataService: ModalDataService,
    private roleService: RoleService

  ) { }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      username: [{ value: null, disabled: false }, [Validators.required]],
      password: [{ value: "123", disabled: false }, [Validators.required]],
      firstname: [null, [Validators.required]],
      lastname: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      role: [null, [Validators.required]],
      ResponseType: [null, [Validators.required]],
      status: [1],
      CreateDate: [this.getCurrentDate(), [Validators.required]],
      UpdateDate: [this.getCurrentDate()],
      company: [null, [Validators.required]],
      tel: [null, [Validators.required, Validators.pattern('^[0-9]*$')]],
    });
    this.userId = this.modalDataService.getUserId();

    if (this.userId) {
      this.loadUserData(this.userId);
      this.validateForm.get('username')?.disable();
      this.validateForm.get('password')?.disable();
      if (this.CheckRole == 1) {
        this.validateForm.get('company')?.disable();
        this.validateForm.get('responseType')?.disable();
      } else {
        this.validateForm.get('company')?.enable();
        this.validateForm.get('responseType')?.enable();
      }
    }

    this.validateForm.get('role')?.valueChanges.subscribe((roleId) => {
      if (roleId === 1) { 
        this.validateForm.get('company')?.setValue(['ALL']); 
        this.validateForm.get('company')?.disable();
      } else {
        this.validateForm.get('company')?.reset(); 
        this.validateForm.get('company')?.enable();
      }
    });
    this.getDataRole();
    this.getDataCompany();
    this.getAllUserResponsible();
  }

  getCurrentDate(): string {
    const now = new Date();
    return now.toISOString();
  }

  save(): void {
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
        this.submitForm();
      }
    });
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      const formData = this.validateForm.getRawValue();
      const selectedCompanies = formData.company;

      formData.company = selectedCompanies.join(',');
      if (this.userId) {
        this.onUpdate(formData);
      }
      else {
        this.userService.addData(formData).subscribe({
          next: (response) => {
            Swal.fire('Saved!', 'Your data has been saved.', 'success');
            this.handleCancelClick();
          },
          error: (error) => {
            console.error('Error saving data', error);
            Swal.fire('Error!', 'There was an error saving your data.', 'error');
          }
        });
      }
    }
    else {
      this.validateForm.markAllAsTouched();
      Swal.fire('Invalid Form', 'Please fill out all required fields.', 'error');
    }
  }

  onUpdate(formData: any): void {
    if (this.validateForm.valid && this.userId) {
      this.userService.updateUser(this.userId, formData).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Your data has been updated.',
            showConfirmButton: false,
            timer: 1500
          });
          this.handleCancelClick();
        },
        error: (err) => {
          console.error('Error updating data', err);
        }
      });
    } else {
      this.validateForm.markAllAsTouched();
      Swal.fire('Invalid Form', 'Please fill out all required fields.', 'error');
    }

  }

  handleCancelClick(): void {
    this.modalInstance.destroy();
  }

  getDataCompany(): void {
    this.supplierService.getDataCompany().subscribe({
      next: (response: any) => {
        this.listOfCompany = response;
        this.filteredDataompany = [...this.listOfCompany];
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  getDataRole(): void {
    this.roleService.getRoles().subscribe({
      next: (response: any) => {
        this.listOfRole = response;
        this.filteredDataRole = [...this.listOfRole];
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  loadUserData(id: number): void {
    this.userService.findUserById(id).subscribe((data: any) => {
      const companyArray = data.company.split(',');
      this.validateForm.patchValue({
        UserId: data.UserId,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        role: data.role,
        ResponseType: data.responseType,
        status: data.status,
        CreateDate: data.createDate,
        UpdateDate: data.updateDate,
        username: data.username,
        password: data.password,
        company: companyArray,
        tel: data.tel
      });
      this.CheckRole = this.validateForm.value.role
      const roleInfo = this.listOfRole.find(role => role.id === this.validateForm.value.role );
      this.validateForm.value.role = roleInfo?.roleName
      const responseTypeCheck = this.listOfDataUserResponsible.find(res => res.id === this.validateForm.value.responseType );
      this.validateForm.value.responseType = responseTypeCheck?.responseType
      this._cdr.markForCheck();
    });
  }

  getAllUserResponsible(): void {
    this.userService.GetAllUserResponsible().subscribe({
      next: (response: any) => {
        this.listOfDataUserResponsible = response
        this.filteredDataUserResponsible = [...this.listOfDataUserResponsible];
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  preventPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(clipboardData)) {
      event.preventDefault();
    }
  }
}