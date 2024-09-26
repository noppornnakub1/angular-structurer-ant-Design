import { Component, EventEmitter, Output, OnInit, Input, inject, ChangeDetectorRef, Inject } from '@angular/core';
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
  @Input() userId!: number; // กำหนด input property นี้
  listOfCompany: DataCompany[] = [];
  filteredDataompany: DataCompany[] = [];
  listOfRole: IRole[] = [];
  filteredDataRole: IRole[] = [];
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
      password: [{ value: null, disabled: false }, [Validators.required]],
      firstname: [null, [Validators.required]],
      lastname: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      role: [null, [Validators.required]],
      status: [1],
      create_date: [this.getCurrentDate(), [Validators.required]],
      update_date: [this.getCurrentDate(), [Validators.required]],
      company: [null, [Validators.required]],
    });
    this.userId = this.modalDataService.getUserId();

    if (this.userId) {
      this.loadUserData(this.userId);
      this.validateForm.get('username')?.disable();
      this.validateForm.get('password')?.disable();
    }
    this.getDataRole();
    this.getDataCompany();
  }

  getCurrentDate(): string {
    const now = new Date();
    return now.toISOString(); // ใช้ ISO string เพื่อให้ตรงกับรูปแบบที่ต้องการ
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
      // const formData = this.validateForm.value;
      const formData = this.validateForm.getRawValue();
      const selectedCompanies = formData.company; // This will be an array of selected companies

      formData.company = selectedCompanies.join(',');
      // ทำการส่งข้อมูล formData ไปยัง API ของคุณ
      if (this.userId) {
        this.onUpdate(formData);
      }
      else {
        this.userService.addData(formData).subscribe({
          next: (response) => {
            Swal.fire('Saved!', 'Your data has been saved.', 'success');
            this.handleCancelClick();
            location.reload();
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
        // Handle error
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
        // Handle error
      }
    });
  }

  loadUserData(id: number): void {
    this.userService.findUserById(id).subscribe((data: any) => {
      // แปลง company จาก string เป็น array
      const companyArray = data.company.split(',');
      this.validateForm.patchValue({
        user_id: data.user_id,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        role: data.role,
        status: data.status,
        create_date: data.create_date,
        update_date: data.update_date,
        username: data.username,
        password: data.password,
        company: companyArray // ใช้ array แทน string
      });
      console.log(this.validateForm.value);
      
      this._cdr.markForCheck();
    });
  }
}
