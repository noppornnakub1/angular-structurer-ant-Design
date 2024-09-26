import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/download-form/download-form.component').then(c => c.DownloadFormComponent)
  },
];

export default routes;
