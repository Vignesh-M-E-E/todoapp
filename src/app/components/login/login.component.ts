import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required';
      return;
    }

    const credentials = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.successMessage = 'Login successful! Redirecting to Todo page...';
        setTimeout(() => {
          this.router.navigate(['/todo']);
        }, 1500);
      },
      error: (error) => {
        if (error.status === 401) {
          this.errorMessage = error.message || 'Invalid credentials. Please try again.';
        } else {
          this.errorMessage = error.message || 'Login failed. Please try again.';
        }
      }
    });
  }
}
