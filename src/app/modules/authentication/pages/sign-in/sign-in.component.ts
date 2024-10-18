import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthMockupService } from '../../../../core/mockup-api/auth-mockup.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { UserService } from '../../../user-manager/services/user.service';
import { EmailService } from '../../../../shared/constants/email.service';

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
  passwordFieldType: string = 'password';
  isPasswordVisible = false;
  isForgotPasswordModalVisible = false;
  forgotPasswordUsername = '';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private emailService: EmailService
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
            // เรียก getRole หลังจาก login สำเร็จ
            this.authService.getRole(response.role).subscribe(
              responseRole => {
                if (responseRole) {
                  // แสดงข้อความสำเร็จ
                  Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                  });
  
                  // รอนำทางหลังจาก getRole สำเร็จ
                  this.router.navigate(['/feature/dashboard']);
                }
              },
              error => {
                console.error('Fetching role failed', error);
                this.errorMessage = 'Fetching role failed. Please try again later.';
                Swal.fire('Error!', 'การดึงข้อมูล role ล้มเหลว', 'error');
              }
            );
          } else {
            // ถ้า login ไม่สำเร็จ
            this.errorMessage = 'Invalid username or password';
            Swal.fire('Error!', 'กรุณาตรวจสอบ Username และ Password ให้ถูกต้อง', 'error');
          }
        },
        error => {
          // เมื่อ login ล้มเหลว
          console.error('Login failed', error);
          this.errorMessage = 'Login failed. Please try again later.';
          Swal.fire('Error!', 'การเข้าสู่ระบบล้มเหลว', 'error');
        }
      );
    } else {
      // ฟอร์มไม่ถูกต้อง
      this.errorMessage = 'Please fill out the form correctly.';
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  // เปิด modal
  openForgotPasswordModal(): void {
    this.isForgotPasswordModalVisible = true;
  }

  // ปิด modal
  handleCancel(): void {
    this.isForgotPasswordModalVisible = false;
  }

  async handleOk(): Promise<void> {
    if (this.forgotPasswordUsername.trim() === '') {
      Swal.fire('Error', 'Please enter a username', 'error');
      return;
    }

    try {
      const user = await this.userService.findUserByUsername(this.forgotPasswordUsername).toPromise();
      if (user) {
        const newPassword = this.generateRandomPassword();
    
        // อัปเดตรหัสผ่านก่อน
        await this.userService.updatePassword(user.username, newPassword).toPromise();
    
        // หลังจากอัปเดตรหัสผ่านแล้ว ส่งอีเมล
        const to = user.email;
        const subject = 'Password Reset';
        const body = `รหัสผ่านใหม่ของคุณคือ: ${newPassword}`; 
        await this.emailService.sendEmail(to, subject, body).toPromise();
    
        Swal.fire('Success', 'A new password has been sent to your email.', 'success');
        
      } else {
        Swal.fire('Not Found', 'User not found. Please contact IT.', 'error');
      }
    } catch (error) {
      // จัดการข้อผิดพลาดทั้งหมดที่เกิดขึ้น
      console.error('Error:', error);
      Swal.fire('Error', 'An error occurred. Please try again later.', 'error');
    } finally {
      this.isForgotPasswordModalVisible = false; // ปิด modal
    }
  }

  generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8); // รหัสผ่านแบบสุ่ม 8 ตัวอักษร
  }

}
