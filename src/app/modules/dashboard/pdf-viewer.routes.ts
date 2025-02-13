import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pdf-viewer/pdf-viewer.component').then(c => c.PdfViewerComponent)
  },
];

export default routes;
