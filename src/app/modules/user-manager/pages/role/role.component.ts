import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalService, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { IRole } from '../../interface/role.interface';
import { RoleService } from '../../services/role.service';
import { AddRoleModalComponent } from './add-role-modal/add-role-modal.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../authentication/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzTableModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    FormsModule
  ],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
})
export class RoleComponent implements OnInit {

  currentUser!: IRole | null;
  isAdmin = false;
  isApproved = false;
  isUser = false;

  listOfData: IRole[] = [];
  filteredData: IRole[] = [];
  filters = { roleName: ''};
  
  private readonly _router = inject(Router);
  private readonly authService = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);

  constructor(private roleService: RoleService, private modalService: NzModalService) {}

  ngOnInit(): void {
    this.checkRole();
    this.getData();
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

  getData(): void {
    this.roleService.getRoles().subscribe({
      next: (response: any) => {
        this.listOfData = response;
        this.filteredData = response;
        this._cdr.markForCheck();
      },
      error: () => {
        // Handle error
      }
    });
  }


  applyFilters(): void {
    const { roleName} = this.filters;
    this.filteredData = this.listOfData.filter(data =>
      (data.roleName?.includes(roleName) ?? true)
    );
  }

  showAddRoleModal(): void {
    const modal: NzModalRef = this.modalService.create({
      nzTitle: 'Add Role',
      nzContent: AddRoleModalComponent,
      nzFooter: null,
    });

    const instance = modal.getContentComponent() as AddRoleModalComponent;
    instance.isVisible = true;  // Set the visibility here

    instance.handleOk.subscribe((result: any) => {
      if (result) {
        // this.roles.push({
        //   id: this.roles.length + 1,
        //   name: result.roleName,
        //   description: result.roleDescription,
        // });
      }
      modal.close();
    });

    instance.handleCancel.subscribe(() => {
      modal.close();
    });
  }
}
