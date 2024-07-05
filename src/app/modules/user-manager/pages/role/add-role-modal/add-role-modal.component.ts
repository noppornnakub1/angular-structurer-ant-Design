import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-role-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './add-role-modal.component.html',
  styleUrls: ['./add-role-modal.component.scss'],
})
export class AddRoleModalComponent implements OnInit {
  @Input() isVisible = false;
  @Output() handleOk = new EventEmitter<any>();
  @Output() handleCancel = new EventEmitter<void>();

  validateForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      roleName: [null, [Validators.required]],
      roleDescription: [null, [Validators.required]],
    });
  }

  submitForm(): void {
    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }
    if (this.validateForm.valid) {
      this.handleOk.emit(this.validateForm.value);
    }
  }

  handleCancelClick(): void {
    this.handleCancel.emit();
  }
}
