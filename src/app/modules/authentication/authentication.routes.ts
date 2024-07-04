import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/sign-in/sign-in.component').then(c => c.SignInComponent)
  },
];

export default routes;
