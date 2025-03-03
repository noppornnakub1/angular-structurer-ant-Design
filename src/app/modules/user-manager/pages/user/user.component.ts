import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
import { RoleService } from '../../services/role.service';
import { ModalDataService } from '../../../../shared/constants/ModalDataService';
import { IUserManage } from '../../interface/user-manage.interface';
import { IUserResponsible } from '../../interface/response-type.interface';

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
    NgZorroAntdModule
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  currentUser!: IRole | null;
  filterForm!: FormGroup;
  private roles: any[] = [];
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;
  displayData: IUserManage[] = [];
  listOfDataRole: IRole[] = [];
  listOfData: IUserManage[] = [];
  filteredData: IUserManage[] = [];
  listOfDataUserResponsible: IUserResponsible[] = [];
  filteredDataUserResponsible: IUserResponsible[] = [];
  filters = { name: '', username: '' };
  pageIndex: number = 1;
  pageSize: number = 10;
  isLoading: boolean = false;
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private userService: UserService,
    private modalService: NzModalService,
    private fb: FormBuilder,
    private roleService: RoleService,
    private modalDataService: ModalDataService,) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      name: [''],
      username: ['']
    });
    this.loadRoles();
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
    this.isLoading = true;
    this.userService.getUser().subscribe({
      next: (response: any) => {
        this.listOfData = response
        this.filteredData = [...this.listOfData];
        this.getAllUserResponsible()
        // this.updateDisplayData();
        this._cdr.markForCheck();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
    this.isLoading = false;
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(data => {
      this.listOfDataRole = data;
    });
  }

  hasRole(roleId: number): boolean {
    return this.roles.some(r => r.id === roleId);
  }

  getRoleName(roleId: number): string {
    const role = this.listOfDataRole.find(r => r.id === roleId);
    return role ? role.roleName : 'Unknown';
  }

  applyFilters(): void {
    const { name, username } = this.filterForm.value;
    this.filteredData = this.listOfData.filter(data =>
      (data.firstname?.includes(name) ?? true) &&
      (data.username?.includes(username) ?? true)
    );
    this.updateDisplayData();
  }

  showAddRoleModal(): void {
    this.modalDataService.clearData();
    const modal: NzModalRef = this.modalService.create({
      nzTitle: 'Add User',
      nzContent: AddUserModelComponent,
      nzFooter: null
    });

    modal.afterOpen.subscribe(() => {
      const instance = modal.getContentComponent();
      instance.modalInstance = modal;
    });
    modal.afterClose.subscribe(() => {
      window.location.reload();
      this.getUser();
    });
  }

  editUser(id: number): void {
    this.modalDataService.setUserId(id);
    const modal: NzModalRef = this.modalService.create({
      nzTitle: 'Edit User',
      nzContent: AddUserModelComponent,
      nzFooter: null
    }); 
    modal.afterOpen.subscribe(() => {
      const instance = modal.getContentComponent();
      instance.modalInstance = modal;
    });

    modal.afterClose.subscribe(() => {
      window.location.reload();
      this.getUser();
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updateDisplayData();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.updateDisplayData();
  }

  updateDisplayData(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayData = this.filteredData.slice(startIndex, endIndex);
    this._cdr.markForCheck();
  }

  getAllUserResponsible(): void {
    this.userService.GetAllUserResponsible().subscribe({
      next: (response: any) => {
        this.listOfDataUserResponsible = response
        this.filteredDataUserResponsible = [...this.listOfDataUserResponsible];
        this.updateUserResponseType();
        this.updateDisplayData();
        this._cdr.markForCheck();
      },
      error: () => {
      }
    });
  }
  
  updateUserResponseType(): void {
    if (this.listOfData && this.listOfDataUserResponsible) {
      this.listOfData = this.listOfData.map(user => {
        const matched = this.listOfDataUserResponsible.find(
          (responsible: any) => Number(responsible.id) === Number(user.responseType)
        );
        return {
          ...user, 
          responseTypeName: matched ? matched.responseType : 'Unknown'
        };
      });
      this.displayData = [...this.listOfData];
      this.filteredData = this.displayData
      this.updateDisplayData();
    }
  }
}