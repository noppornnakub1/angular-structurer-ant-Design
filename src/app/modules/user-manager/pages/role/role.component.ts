import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalService, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { IRole } from '../../interface/role.interface';
import { RoleService } from '../../services/role.service';
import { AddRoleModalComponent } from './add-role-modal/add-role-modal.component';

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
  ],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
})
export class RoleComponent implements OnInit {
  roles: IRole[] = [];

  constructor(private roleService: RoleService, private modalService: NzModalService) {}

  ngOnInit(): void {
    this.roleService.getRoles().subscribe((data) => {
      this.roles = data;
    });
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
