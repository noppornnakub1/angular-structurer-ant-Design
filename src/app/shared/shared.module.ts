import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

const coreModules: any[] = [CommonModule, FormsModule, ReactiveFormsModule, RouterModule];
const additionalModules: any[] = [];
const pipes: any[] = [];
const directives: any[] = [];
@NgModule({
  declarations: [...pipes, ...directives],
  imports: [...coreModules, ...additionalModules],
  exports: [...coreModules, ...additionalModules, ...pipes, ...directives],
})
export class SharedModule { }
