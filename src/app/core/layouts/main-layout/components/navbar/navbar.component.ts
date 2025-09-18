import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {initFlowbite } from 'flowbite'
import { UserService } from '../../../../../features/auth/services/user.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  user = computed(() => this.userService.user());
  ngOnInit(): void {
    initFlowbite();
    this.userService.getLoggedUserData().subscribe();
    
  }

  logout():void{
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
