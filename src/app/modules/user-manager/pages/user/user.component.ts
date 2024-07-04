import { Component } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { IUser } from '../../interface/user.interface';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [SharedModule,NgZorroAntdModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  users: IUser[] = [];

  isAdmin: boolean = false;
  isApproved: boolean = false;
  isUser: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe(data => {
      this.users = data;
    });
  
  }

  addData(): void {
    // Add logic to add data
  }
}
