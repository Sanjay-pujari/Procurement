import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-login',
    imports: [FormsModule, CommonModule, RouterLink],
    template: `
  <div class="login">
    <h2>ProcurePro Login</h2>
    <form (ngSubmit)="submit()">
      <input [(ngModel)]="email" name="email" placeholder="Email" type="email" required />
      <input [(ngModel)]="password" name="password" placeholder="Password" type="password" required />
      <div *ngIf="twoFactorRequired" class="two-factor">
        <label>Enter the verification code we sent via {{ deliveryChannelLabel }}</label>
        <input [(ngModel)]="twoFactorCode" name="twoFactorCode" placeholder="2FA Code" required />
      </div>
      <button type="submit">{{ twoFactorRequired ? 'Verify & Login' : 'Login' }}</button>
    </form>
    <p *ngIf="infoMessage" class="info">{{ infoMessage }}</p>
    <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
    <p class="hint">Default admin: admin@procurepro.local / Admin#12345</p>
    <p class="links">
      <a routerLink="/vendor-signup">Need a vendor account? Sign up here</a>
    </p>
  </div>
  `,
    styles: [`
    .login{max-width:360px;margin:6rem auto;display:flex;flex-direction:column;gap:12px}
    form{display:flex;flex-direction:column;gap:12px}
    input{padding:0.75rem;border:1px solid #d1d5db;border-radius:6px;font-size:1rem}
    button{padding:0.75rem;border:none;border-radius:6px;background:#3b82f6;color:white;font-weight:600;cursor:pointer}
    button:hover{background:#2563eb}
    .hint{font-size:0.75rem;color:#6b7280}
    .two-factor{display:flex;flex-direction:column;gap:8px}
    .info{color:#047857}
    .error{color:#b91c1c}
    .links{margin-top:0.5rem;font-size:0.9rem}
    .links a{color:#2563eb}
    `]
})
export class LoginComponent {
  email = 'admin@procurepro.local';
  password = 'Admin#12345';
  twoFactorCode = '';
  twoFactorRequired = false;
  deliveryChannel: string | null = null;
  infoMessage = '';
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.errorMessage = '';
    const code = this.twoFactorRequired ? this.twoFactorCode : undefined;
    this.auth.login(this.email, this.password, code).subscribe({
      next: (response: LoginResponse) => {
        if (response.requiresTwoFactor) {
          this.twoFactorRequired = true;
          this.deliveryChannel = response.deliveryChannel ?? 'email';
          this.infoMessage = `Check your ${this.deliveryChannelLabel} for the verification code.`;
          this.twoFactorCode = '';
          return;
        }

        if (response.token) {
          this.auth.saveToken(response.token);
          this.router.navigateByUrl('/');
        } else {
          this.errorMessage = 'Unable to complete login. Please try again.';
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Invalid credentials';
        if (this.twoFactorRequired) {
          this.twoFactorCode = '';
        }
      }
    });
  }

  get deliveryChannelLabel(): string {
    if (!this.deliveryChannel) {
      return 'email';
    }
    switch (this.deliveryChannel) {
      case 'email':
        return 'email';
      case 'sms':
        return 'SMS';
      default:
        return this.deliveryChannel;
    }
  }
}
