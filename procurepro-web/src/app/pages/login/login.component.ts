import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule],
    template: `
  <div class="login">
    <h2>ProcurePro Login</h2>
    <form (ngSubmit)="submit()">
      <input [(ngModel)]="email" name="email" placeholder="Email" type="email" required />
      <input [(ngModel)]="password" name="password" placeholder="Password" type="password" required />
      <button type="submit">Login</button>
    </form>
    <p class="hint">Default admin: admin@procurepro.local / Admin#12345</p>
  </div>
  `,
    styles: [`.login{max-width:360px;margin:6rem auto;display:flex;flex-direction:column;gap:12px}`]
})
export class LoginComponent {
  email = 'admin@procurepro.local';
  password = 'Admin#12345';
  constructor(private auth: AuthService, private router: Router) {}
  submit() {
    this.auth.login(this.email, this.password).subscribe({
      next: t => { this.auth.saveToken(t); this.router.navigateByUrl('/'); },
      error: _ => alert('Invalid credentials')
    });
  }
}
