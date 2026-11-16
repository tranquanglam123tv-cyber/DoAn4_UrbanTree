import { AppNotification } from '../types';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:5001`
  : 'http://localhost:5001';

export interface NotificationResponse {
  success: boolean;
  data: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export class NotificationApiService {
  private static async getHeaders(token?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async fetchNotifications(token: string, options: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<NotificationResponse | null> {
    try {
      const query = new URLSearchParams();
      if (options.page) query.set('page', String(options.page));
      if (options.limit) query.set('limit', String(options.limit));
      if (options.unreadOnly) query.set('unreadOnly', 'true');

      const res = await fetch(`${API_BASE_URL}/api/notifications?${query.toString()}`, {
        headers: await this.getHeaders(token),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('❌ Lỗi kết nối Notification API:', err);
      return null;
    }
  }

  static async getUnreadCount(token: string): Promise<number> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: await this.getHeaders(token),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.success ? data.count : 0;
    } catch {
      return 0;
    }
  }

  static async markAsRead(token: string, id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: await this.getHeaders(token),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async markAllAsRead(token: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: await this.getHeaders(token),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async deleteNotification(token: string, id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(token),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

