import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { IUser } from '../../interface/user.interface';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { NzModalService, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AddUserModelComponent } from './add-user-model/add-user-model.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../authentication/services/auth.service';
import { IRole } from '../../interface/role.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzTableModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  currentUser!: IRole | null;
  filterForm!: FormGroup;

  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;

  listOfData: IUser[] = [];
  filteredData: IUser[] = [];
  filters = { name: '', username: '' };

  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private userService: UserService, private modalService: NzModalService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      name: [''],
      username: ['']
    });

    this.checkRole();
    this.getUser();
  }

  checkRole(): void {
    this.authService.currenttRole.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.action.includes('admin');
        this.isApproved = user.action.includes('approved');
        this.isUser = user.action.includes('user');
      }
    });
  }

  getUser(): void {
    this.userService.getUser().subscribe({
      next: (response: any) => {
        this.listOfData = response.map((user: IUser) => ({
          ...user,
          role: this.getRole(user.role)
        }));
        this.filteredData = [...this.listOfData];
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }

  getRole(role: string): string {
    switch (role) {
      case '1':
        return 'Admin';
      case '2':
        return 'User';
      case '3':
        return 'Approver';
      default:
        return 'Unknown';
    }
  }

  applyFilters(): void {
    const { name, username } = this.filterForm.value;
    this.filteredData = this.listOfData.filter(data =>
      (data.firstname?.includes(name) ?? true) &&
      (data.username?.includes(username) ?? true)
    );
  }

  addData(): void {
    // Add logic to add data
  }

  showAddRoleModal(): void {
    const modal: NzModalRef = this.modalService.create({
      nzTitle: 'Add Role',
      nzContent: AddUserModelComponent,
      nzFooter: null,
    });
  }
}
