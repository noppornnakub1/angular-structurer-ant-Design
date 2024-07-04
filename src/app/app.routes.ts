import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { NoAuthGuard } from './core/guard/no-auth.guard';
import { AuthGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/auth' },
  {
    path: "auth",
    loadChildren: () => import("./modules/authentication/authentication.routes")
  },
  {
    path: 'feature',
    component: LayoutsComponent,
    children: [
      { path: '', redirectTo: 'feature/dashboard', pathMatch: 'full' },
      {
        
        path: "dashboard",
        data: {
          customBreadcrumb: 'Display Name'
        },
        loadChildren: () => import("./modules/dashboard/dashboard.routes")
      },
      {
        path: "customer",
        loadChildren: () => import("./modules/customer/customer.routes")
      },
      {
        path: "supplier",
        loadChildren: () => import("./modules/supplier/supplier.routes")
      },
      {
        path: "user-manager",
        loadChildren: () => import("./modules/user-manager/user-manager.routes")
      },
    ]
  }
];
