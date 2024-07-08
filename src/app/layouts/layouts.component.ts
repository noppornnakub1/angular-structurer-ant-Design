
import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgZorroAntdModule } from '../shared/ng-zorro-antd.module';
import { AuthMockupService } from '../core/mockup-api/auth-mockup.service';
import { IUser } from '../modules/user-manager/interface/user.interface';
import { IRole } from '../modules/user-manager/interface/role.interface';
import { AuthService } from '../modules/authentication/services/auth.service';


export interface MenuItem {
  title: string;
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [NgZorroAntdModule, RouterOutlet],
  templateUrl: './layouts.component.html',
  styleUrl: './layouts.component.scss'
})
export class LayoutsComponent {
  isCollapsed = false;
  currentUser!: IUser | null;
  currentRole!: IRole | null;
  filteredMenuItems: MenuItem[] = [];
  currentRoute!: string;
  private readonly authService = inject(AuthService);

  constructor(private _router: Router) {
    this.currentRoute = this._router.url;  // Initialize currentRoute
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentRoute = (event as NavigationEnd).urlAfterRedirects;
    });
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      
    });
    this.authService.currenttRole.subscribe(user => {
      this.currentRole = user;
      
      this.filterMenuItemsByRole();
     
    });
  }

  menuItems: MenuItem[] = [
    // { title: 'Dashboard', icon: 'dashboard', label: 'Dashboard', route: '/feature/dashboard' },
    { title: 'Customer', icon: 'user', label: 'Customer', route: '/feature/customer' },
    { title: 'Supplier', icon: 'shop', label: 'Supplier', route: '/feature/supplier' },
    { title: 'User', icon: 'team', label: 'User', route: '/feature/user-manager/user', roles: ['admin']},
    { title: 'Role', icon: 'solution', label: 'Role', route: '/feature/user-manager/role',roles: ['admin'] }
  ];
  
  filterMenuItemsByRole(): void {
    console.log("this.currentRole!.action" , this.currentRole!.action);
    
    if (this.currentRole && this.currentRole.action) {
      this.filteredMenuItems = this.menuItems.filter(item => {
        if (item.roles) {
          return item.roles.some(role => this.hasRole(this.currentRole!.action, 'admin'));
        }
        return true;
      });
    }
  }
  
  hasRole(roleString: string, roleToCheck: string): boolean {
    const roleArray = roleString.split(',');
    return roleArray.includes(roleToCheck);
  }




  navigateTo(routeName: string): void {
    this._router.navigate([routeName])
  }

  isActive(route: string): boolean {
    const currentRoute = this._router.url;
    return currentRoute.startsWith(route);
  }


}
