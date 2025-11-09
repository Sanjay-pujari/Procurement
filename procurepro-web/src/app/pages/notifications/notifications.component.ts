import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationsService, Notification } from '../../services/notifications.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, DatePipe],
    template: `
  <section class="notifications-shell">
    <header class="page-header">
      <div>
        <h1>Notifications</h1>
        <p>Stay on top of approvals, sourcing events, and fulfilment updates.</p>
      </div>
      <button class="mark-all" (click)="markAllRead()" [disabled]="!hasUnread()">Mark all as read</button>
    </header>

    <div *ngIf="loading" class="state-card loading">
      <div class="spinner"></div>
      <p>Loading your notifications…</p>
    </div>

    <div *ngIf="error" class="state-card error">
      <h2>We couldn't load notifications.</h2>
      <p>{{ error }}</p>
      <button (click)="reload()">Retry</button>
    </div>

    <ul *ngIf="!loading && !error && notifications.length" class="notifications-list">
      <li *ngFor="let notification of notifications" [class.unread]="!notification.isRead">
        <div class="content">
          <div class="title-row">
            <h3>{{ notification.title }}</h3>
            <small>{{ notification.createdAt | date:'medium' }}</small>
          </div>
          <p>{{ notification.message }}</p>
        </div>
        <button class="mark" *ngIf="!notification.isRead" (click)="markRead(notification)">Mark as read</button>
      </li>
    </ul>

    <div *ngIf="!loading && !error && !notifications.length" class="state-card empty">
      <h2>You're all caught up</h2>
      <p>We’ll let you know as soon as there’s something new.</p>
    </div>
  </section>
  `,
    styles: [`
    :host { display: block; padding: 2rem; }
    .notifications-shell { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 2rem; }
    .page-header p { margin: 0.5rem 0 0; color: #6b7280; max-width: 420px; }
    .mark-all { background: #2563eb; color: white; border: none; border-radius: 999px; padding: 0.6rem 1.5rem; font-weight: 600; cursor: pointer; }
    .mark-all:disabled { opacity: 0.4; cursor: not-allowed; }
    .notifications-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
    .notifications-list li { display: flex; justify-content: space-between; gap: 1rem; background: white; padding: 1.5rem; border-radius: 14px; box-shadow: 0 18px 35px rgba(15,23,42,0.08); align-items: center; }
    .notifications-list li.unread { border-left: 4px solid #2563eb; }
    .content { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .title-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
    .title-row h3 { margin: 0; font-size: 1.1rem; }
    .title-row small { color: #9ca3af; font-weight: 500; }
    .mark { background: transparent; color: #2563eb; border: 1px solid #2563eb; border-radius: 999px; padding: 0.4rem 1.2rem; font-weight: 600; cursor: pointer; }
    .state-card { background: white; padding: 2.5rem; border-radius: 16px; text-align: center; box-shadow: 0 18px 35px rgba(15,23,42,0.08); display: flex; flex-direction: column; gap: 0.75rem; align-items: center; }
    .state-card.error { border-left: 4px solid #dc2626; }
    .state-card.empty { border-left: 4px solid #22c55e; }
    .spinner { width: 48px; height: 48px; border-radius: 999px; border: 4px solid #dbeafe; border-top-color: #2563eb; animation: spin 0.8s linear infinite; }
    .state-card button { background: #2563eb; color: white; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 720px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .notifications-list li { flex-direction: column; align-items: flex-start; }
      .mark { width: 100%; text-align: center; }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private notificationsService = inject(NotificationsService);

  notifications: Notification[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.load();
  }

  markRead(notification: Notification): void {
    this.notificationsService.markRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.notificationsService.decrementUnread();
      },
      error: err => this.error = err?.error?.message ?? 'Failed to mark notification as read.'
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.notificationsService.resetUnread();
      },
      error: err => this.error = err?.error?.message ?? 'Failed to mark notifications as read.'
    });
  }

  hasUnread(): boolean {
    return this.notifications.some(n => !n.isRead);
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.notificationsService.getAll().subscribe({
      next: items => {
        this.notifications = items;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message ?? 'An unexpected error occurred.';
        this.loading = false;
      }
    });

    this.notificationsService.refreshUnreadCount().subscribe();
  }
}

