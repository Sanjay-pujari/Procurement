import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  channel: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBase}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);

  unreadCount$ = this.unreadCountSubject.asObservable();

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  refreshUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/unread-count`).pipe(
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mark-all-read`, {});
  }

  decrementUnread(): void {
    const next = Math.max(0, this.unreadCountSubject.value - 1);
    this.unreadCountSubject.next(next);
  }

  resetUnread(): void {
    this.unreadCountSubject.next(0);
  }
}

