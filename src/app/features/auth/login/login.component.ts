import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule], // Added RouterModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // Fixed: styleUrls (plural)
})
export class LoginComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  loginForm!: FormGroup;
  msg: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [
        Validators.required, 
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(20)
      ])
    });
  }

  submitLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const loginData = { ...this.loginForm.value };
      console.log('Login attempt:', loginData); // Debug log
      
      this.userService.signIn(loginData).subscribe({
        next: (res) => {
          this.isLoading = false;
          console.log('Login response:', res); // Debug log
          
          if (res.message === 'success' && res.token) {
            this.toastr.success('Login successful!', 'Success');
            localStorage.setItem('token', res.token);
            this.router.navigate(['/timeline']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error:', err); // Debug log
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  getControl(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }
}