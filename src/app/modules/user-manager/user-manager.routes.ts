import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: 'user',
    loadComponent: () => import('./pages/user/user.component').then(c => c.UserComponent)
  },
  {
    path: 'role',
    loadComponent: () => import('./pages/role/role.component').then(c => c.RoleComponent)
  },
];

export default routes;
