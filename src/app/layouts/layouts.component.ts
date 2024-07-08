
import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgZorroAntdModule } from '../shared/ng-zorro-antd.module';
import { AuthMockupService } from '../core/mockup-api/auth-mockup.service';
import { IUser } from '../modules/user-manager/interface/user.interface';


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
  filteredMenuItems: MenuItem[] = [];
  currentRoute!: string;
  private readonly authService = inject(AuthMockupService);

  constructor(private _router: Router) {
    this.currentRoute = this._router.url;  // Initialize currentRoute
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentRoute = (event as NavigationEnd).urlAfterRedirects;
    });
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.filterMenuItemsByRole();
      console.log(this.currentUser)
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
    if (this.currentUser && this.currentUser.roles) {
      this.filteredMenuItems = this.menuItems.filter(item => {
        if (item.roles) {
          return item.roles.some(role => this.currentUser!.roles.includes(role));
        }
        return true;
      });
    }
  }


  navigateTo(routeName: string): void {
    this._router.navigate([routeName])
  }

  isActive(route: string): boolean {
    const currentRoute = this._router.url;
    return currentRoute.startsWith(route);
  }


}
