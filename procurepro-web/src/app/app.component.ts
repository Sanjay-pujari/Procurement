import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { NotificationsService } from './services/notifications.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'procurepro-web';
  notificationsCount = 0;
  private routerSub?: Subscription;
  private unreadSub?: Subscription;

  constructor(
    public auth: AuthService,
    private router: Router,
    private notifications: NotificationsService
  ) {}

  ngOnInit(): void {
    this.unreadSub = this.notifications.unreadCount$.subscribe(count => this.notificationsCount = count);

    if (this.auth.isAuthenticated()) {
      this.notifications.refreshUnreadCount().subscribe();
    }

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.auth.isAuthenticated()) {
          this.notifications.refreshUnreadCount().subscribe();
        } else {
          this.notifications.resetUnread();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
  }

  logout() {
    this.auth.logout();
    this.notifications.resetUnread();
    this.router.navigateByUrl('/login');
  }
}
