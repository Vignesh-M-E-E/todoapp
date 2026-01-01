import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  register() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'All fields are required';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password should be at least 6 characters';
      return;
    }

    const user = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.authService.register(user).subscribe({
      next: (response) => {
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    });
  }
}
