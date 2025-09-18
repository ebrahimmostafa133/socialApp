import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  

  changePasswordForm!: FormGroup;
  msg: string = '';
  successMsg: string = '';
  isLoading: boolean = false;
  showOldPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.changePasswordForm = new FormGroup(
      {
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20)
        ]),
        newPassword: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20)
        ]),
      },
    );
  }



  submitForm(): void {
    if (this.changePasswordForm.valid) {
      setTimeout(() => {
        this.isLoading = true;
        this.msg = '';
        this.successMsg = '';
      }, 0);

      const formData = { ...this.changePasswordForm.value };
      console.log('Changing password...', { currentPassword: '***', password: '***', rePassword: '***' });

      this.userService.changePassword(formData).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.isLoading = false;
          }, 0);
          
          console.log('Password change response:', response);
          
          if (response.message === 'success') {
            this.successMsg = 'Password changed successfully!';
            this.toastr.success(this.successMsg, 'Success');
            this.changePasswordForm.reset();
            
            setTimeout(() => {
              this.router.navigate(['/login']);
              localStorage.removeItem('token');
            }, 2000);
          }
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoading = false;
          }, 0);
          console.error('Error:', err); // Debug log
        }
      });
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(field: 'old' | 'new' ): void {
    switch (field) {
      case 'old':
        this.showOldPassword = !this.showOldPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
    }
  }

  getControl(controlName: string): FormControl {
    return this.changePasswordForm.get(controlName) as FormControl;
  }

  goBack(): void {
    this.router.navigate(['/timeline']);
  }
}