import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/customer/customer.component').then(c => c.CustomerComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/customer-add/customer-add.component').then(c => c.CustomerAddComponent)
  },
];

export default routes;
