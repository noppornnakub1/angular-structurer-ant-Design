import { ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
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
import { Observable } from 'rxjs';
import { RoleService } from '../../services/role.service';
import { ModalDataService } from '../../../../shared/constants/ModalDataService';


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
  private roles: any[] = [];
  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;

  listOfDataRole: IRole[] = [];
  listOfData: IUser[] = [];
  filteredData: IUser[] = [];
  filters = { name: '', username: '' };

  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private userService: UserService, 
    private modalService: NzModalService, 
    private fb: FormBuilder,
    private roleService : RoleService,
    private modalDataService: ModalDataService,) {}

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
    this.userService.getUser().subscribe({
      next: (response: any) => {
        
        this.listOfData = response
        
        
        this.filteredData = [...this.listOfData];
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(data => {
      this.listOfDataRole = data;
      console.log('Log',data);
    });
  }


  hasRole(roleId: number): boolean {
    return this.roles.some(r => r.id === roleId);
  }

  getRoleName(roleId: number): string {
    const role = this.listOfDataRole.find(r => r.id === roleId);
    return role ? role.role_name : 'Unknown';
  }

  applyFilters(): void {
    const { name, username } = this.filterForm.value;
    this.filteredData = this.listOfData.filter(data =>
      (data.firstname?.includes(name) ?? true) &&
      (data.username?.includes(username) ?? true)
    );
  }

  showAddRoleModal(): void {
    const modal: NzModalRef = this.modalService.create({
      nzTitle: 'Add User',
      nzContent: AddUserModelComponent,
      nzFooter: null
    });
  
    modal.afterOpen.subscribe(() => {
      const instance = modal.getContentComponent();
      instance.modalInstance = modal;
    });
  }

  editUser(id: number): void {
    this.modalDataService.setUserId(id); // เซ็ตค่า user ID
    const modal: NzModalRef = this.modalService.create({
      nzTitle: 'Edit User',
      nzContent: AddUserModelComponent,
      nzFooter: null
    });
    modal.afterOpen.subscribe(() => {
      const instance = modal.getContentComponent();
      instance.modalInstance = modal;
      instance.ngOnInit();
    });
  }
}
