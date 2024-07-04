import { Component } from '@angular/core';
import { IRole } from '../../interface/role.interface';
import { RoleService } from '../../services/role.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss'
})
export class RoleComponent {
 roles: IRole[] = [];

  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.roleService.getRoles().subscribe(data => {
      this.roles = data;
    });
  
  }

  addData(): void {
    // Add logic to add data
  }
}


