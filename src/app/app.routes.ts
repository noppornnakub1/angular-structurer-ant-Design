import { Routes } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { NoAuthGuard } from './core/guard/no-auth.guard';
import { AuthGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/auth' },
  {
    
    path: "auth",
    loadChildren: () => import("./modules/authentication/authentication.routes"),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'feature',
    component: LayoutsComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'feature/dashboard', pathMatch: 'full' },
      {
        path: "dashboard",
        loadChildren: () => import("./modules/dashboard/dashboard.routes")
      },
    ]
  }
];
