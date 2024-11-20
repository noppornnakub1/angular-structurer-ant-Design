import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/export-excel/export-excel.component').then(c => c.ExportExcelComponent)
  },
];

export default routes;
