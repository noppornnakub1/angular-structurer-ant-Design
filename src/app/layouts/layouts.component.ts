
import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgZorroAntdModule } from '../shared/ng-zorro-antd.module';


export interface MenuItem {
  title: string;
  icon: string;
  label: string;
  route: string;
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


  currentRoute!: string;


  constructor(private _router: Router) {
    this.currentRoute = this._router.url;  // Initialize currentRoute
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentRoute = (event as NavigationEnd).urlAfterRedirects;
    });
  }

  menuItems: MenuItem[] = [
    { title: 'Dashboard', icon: 'dashboard', label: 'Dashboard', route: '/feature/dashboard' },
    { title: 'Customer', icon: 'user', label: 'Customer', route: '/feature/customer' },
    { title: 'Supplier', icon: 'shop', label: 'Supplier', route: '/feature/supplier' },
    { title: 'User', icon: 'team', label: 'User', route: '/feature/user-manager/user' },
    { title: 'Role', icon: 'solution', label: 'Role', route: '/feature//user-manager/role' }
  ];
  


  navigateTo(routeName: string): void {
    this._router.navigate([routeName])
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }



}
