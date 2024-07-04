import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NgZorroAntdModule } from './shared/ng-zorro-antd.module';
import { SpinnerLoadComponent } from './shared/components/spinner-load/spinner-load.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgZorroAntdModule, SpinnerLoadComponent],
  template: `<router-outlet></router-outlet><app-spinner-load></app-spinner-load>`,
})
export class AppComponent {
  isCollapsed: boolean = false;
}
