import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-vendor-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="signup">
      <h2>Vendor Registration</h2>
      <p class="subtitle">Create your vendor account and we will notify you once the procurement team approves it.</p>

      <form (ngSubmit)="register()" *ngIf="!completed">
        <label>
          <span>Company Name</span>
          <input type="text" [(ngModel)]="companyName" name="companyName" required />
        </label>

        <label>
          <span>Email</span>
          <input type="email" [(ngModel)]="email" name="email" required />
        </label>

        <label>
          <span>Password</span>
          <input type="password" [(ngModel)]="password" name="password" required minlength="8" />
        </label>

        <label>
          <span>Confirm Password</span>
          <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required minlength="8" />
        </label>

        <label>
          <span>Category <small>(optional)</small></span>
          <input type="text" [(ngModel)]="category" name="category" placeholder="e.g. IT Hardware" />
        </label>

        <button type="submit" [disabled]="isSubmitting">{{ isSubmitting ? 'Submitting…' : 'Register' }}</button>
        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      </form>

      <div class="success" *ngIf="completed">
        <h3>Registration Received</h3>
        <p>
          Thanks for registering! A confirmation email has been sent to <strong>{{ email }}</strong>.
          Our procurement team will review your submission shortly. You can log in once your
          account is approved and activated.
        </p>
        <a routerLink="/login" class="btn">Back to Login</a>
      </div>

      <div class="links">
        <a routerLink="/login">Already have an account? Sign in</a>
      </div>
    </div>
  `,
  styles: [`
    .signup { max-width: 420px; margin: 6rem auto; padding: 2rem; border-radius: 12px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); background: #fff; display: flex; flex-direction: column; gap: 1.25rem; }
    h2 { margin: 0; font-size: 1.75rem; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.95rem; }
    form { display: grid; gap: 1rem; }
    label { display: grid; gap: 0.5rem; font-weight: 600; color: #111827; }
    label span small { font-weight: 400; color: #6b7280; }
    input { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; }
    button { padding: 0.85rem; border: none; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; transition: background 0.2s ease; }
    button[disabled] { background: #93c5fd; cursor: default; }
    button:not([disabled]):hover { background: #1d4ed8; }
    .error { color: #b91c1c; font-size: 0.9rem; margin: 0; }
    .success { display: grid; gap: 1rem; background: #f3f4f6; padding: 1.5rem; border-radius: 10px; }
    .success .btn { display: inline-block; padding: 0.75rem 1.25rem; background: #2563eb; color: #fff; border-radius: 8px; font-weight: 600; text-align: center; }
    .links { text-align: center; font-size: 0.95rem; }
    .links a { color: #2563eb; }
  `]
})
export class VendorSignupComponent {
  companyName = '';
  email = '';
  password = '';
  confirmPassword = '';
  category = '';
  isSubmitting = false;
  completed = false;
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  register(): void {
    this.errorMessage = '';
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    this.auth.registerVendor(this.companyName.trim(), this.email.trim(), this.password, this.category.trim() || undefined).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.completed = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.extractErrorMessage(err) ?? 'Unable to register at the moment. Please try again later.';
      }
    });
  }

  private extractErrorMessage(err: any): string | null {
    if (!err) return null;
    if (err.error?.errors) {
      const firstKey = Object.keys(err.error.errors)[0];
      if (firstKey) {
        const val = err.error.errors[firstKey];
        if (Array.isArray(val)) {
          return val[0];
        }
        return val;
      }
    }
    if (err.error?.message) return err.error.message;
    if (typeof err.error === 'string') return err.error;
    return null;
  }
}
