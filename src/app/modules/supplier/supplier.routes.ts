import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/supplier/supplier.component').then(c => c.SupplierComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/supplier-add/supplier-add.component').then(c => c.SupplierAddComponent)
  },
];

export default routes;
