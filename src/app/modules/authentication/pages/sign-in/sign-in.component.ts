import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthMockupService } from '../../../../core/mockup-api/auth-mockup.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [SharedModule, NgZorroAntdModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void { }
  
  login(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe(
        response => {
          if (response) {
            this.router.navigate(['/feature/customer']);
            console.log('Login successful', response);
          } else {
            this.errorMessage = 'Invalid username or password';
          }
        },
        error => {
          console.error('Login failed', error);
          this.errorMessage = 'Login failed. Please try again later.';
        }
      );
    } else {
      this.errorMessage = 'Please fill out the form correctly.';
    }
  }

}
