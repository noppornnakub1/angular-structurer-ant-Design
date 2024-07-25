import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { NoAuthGuard } from './core/guard/no-auth.guard';
import { AuthGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/auth' },
  {
    path: 'auth',
    loadChildren: () => import('./modules/authentication/authentication.routes').then(m => m.default)
  },
  {
    path: 'feature',
    component: LayoutsComponent,
    canActivate: [AuthGuard], // Apply AuthGuard here
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/dashboard/dashboard.routes').then(m => m.default),
        canActivate: [AuthGuard]
      },
      {
        path: 'customer',
        loadChildren: () => import('./modules/customer/customer.routes').then(m => m.default),
        canActivate: [AuthGuard]
      },
      {
        path: 'supplier',
        loadChildren: () => import('./modules/supplier/supplier.routes').then(m => m.default),
        canActivate: [AuthGuard]
      },
      {
        path: 'user-manager',
        loadChildren: () => import('./modules/user-manager/user-manager.routes').then(m => m.default),
        canActivate: [AuthGuard]
      },
    ]
  }
];
