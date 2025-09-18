import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  registerForm!: FormGroup;
  msg: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = new FormGroup(
      {
        name: new FormControl('', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
        ]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
        ]),
        rePassword: new FormControl('', [Validators.required]), // ✅ Changed from confirmPassword
        dateOfBirth: new FormControl('', [Validators.required]),
        gender: new FormControl('', [Validators.required]),
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // ✅ Updated validator to use 'rePassword'
  passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const rePassword = group.get('rePassword')?.value;
    return password === rePassword ? null : { noMatch: true };
  };

  submitForm() {
    if (this.registerForm.valid) {
      // ✅ Fix: Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isLoading = true;
      }, 0);
      
      // ✅ Transform form data to match API expectations
      const formData = { ...this.registerForm.value };
      
      // Format date as YYYY-MM-DD if needed
      if (formData.dateOfBirth) {
        const date = new Date(formData.dateOfBirth);
        if (!isNaN(date.getTime())) {
          formData.dateOfBirth = date.toISOString().split('T')[0];
        }
      }
      
      // Ensure gender is lowercase
      if (formData.gender) {
        formData.gender = formData.gender.toLowerCase();
      }

      console.log('Sending data:', formData); // ✅ Debug log

      this.userService.signUp(formData).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.isLoading = false;
          }, 0);
          console.log('Response:', response); // ✅ Debug log
          if (response.message === 'success') {
            this.toastr.success('Registration successful!', 'Success');
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoading = false;
          }, 0);
          console.error('Error:', err); // ✅ Debug log
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  getControl(controlName: string): FormControl {
    return this.registerForm.get(controlName) as FormControl;
  }
}