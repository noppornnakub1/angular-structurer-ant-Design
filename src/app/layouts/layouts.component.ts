import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgZorroAntdModule } from '../shared/ng-zorro-antd.module';

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [NgZorroAntdModule, RouterOutlet],
  templateUrl: './layouts.component.html',
  styleUrl: './layouts.component.scss'
})
export class LayoutsComponent {
  isCollapsed = false;
}
