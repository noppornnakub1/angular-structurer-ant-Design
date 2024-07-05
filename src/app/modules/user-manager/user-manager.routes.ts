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
  {
    path: 'add-role',
    loadComponent: () => import('./pages/role/add-role-modal/add-role-modal.component').then(c => c.AddRoleModalComponent)
  },
];

export default routes;
